import {
  MethodInfo,
  ServiceInfo,
  RpcInputStream,
  RpcOutputStream,
  RpcOutputStreamController,
} from "@protobuf-ts/runtime-rpc"
import { BinaryReadOptions, BinaryWriteOptions } from "@protobuf-ts/runtime"
import * as pb from "./pb/sockrpc.ts"
import { Timestamp } from "./pb/google/protobuf/timestamp.ts"
import { WebSocketAdapter } from "./common.ts"

export interface SockRpcServerContext {
  method: MethodInfo<any, any>
  user: string
  deadline?: Date
  abort: AbortSignal
}

type UnaryMethod = (request: any, context: SockRpcServerContext) => Promise<any>
type ClientStreamingMethod = (
  requests: RpcOutputStream<any>,
  context: SockRpcServerContext
) => Promise<any>
type ServerStreamingMethod = (
  request: any,
  responses: RpcInputStream<any>,
  context: SockRpcServerContext
) => Promise<void>
type DuplexStreamingMethod = (
  requests: RpcOutputStream<any>,
  responses: RpcInputStream<any>,
  context: SockRpcServerContext
) => Promise<void>
type PubkeyChallengeValidator = (opts: {
  challenge: Uint8Array
  signature: Uint8Array
}) => Promise<string | null>
type PubkeyValidator = (
  request: pb.ClientAuthRequest_Pubkey
) => Promise<PubkeyChallengeValidator | null>

export interface ServerOptions {
  service: ServiceInfo
  version?: string
  handlers: any
  auth:
    | { userId: string }
    | {
        guest?: () => Promise<string>
        token?: (token: Uint8Array) => Promise<string | null>
        pubkey?: PubkeyValidator
      }
  binaryOptions?: Partial<BinaryReadOptions & BinaryWriteOptions>
}

enum State {
  Auth,
  ProcessingAuth,
  PubkeyChallenge,
  Active,
  Closed,
}

interface ActiveCall {
  method: MethodInfo<any, any>
  abort: AbortController
  outStream?: RpcOutputStreamController<any>
}

class SockRpcServerStream<O extends object> implements RpcInputStream<O> {
  closed: boolean = false
  constructor(
    private readonly id: number,
    private readonly method: MethodInfo<any, O>,
    private readonly socket: WebSocketAdapter,
    private readonly options: ServerOptions
  ) {}

  async send(value: O): Promise<void> {
    if (this.closed) throw new Error("Server stream is closed")
    await this.socket.send(
      pb.ServerMessage.toBinary(
        {
          id: this.id,
          message: {
            oneofKind: "streamRecv",
            streamRecv: this.method.O.toBinary(
              value,
              this.options.binaryOptions
            ),
          },
        },
        this.options.binaryOptions
      )
    )
  }

  async complete(): Promise<void> {
    if (this.closed) throw new Error("Server stream is closed")
    this.closed = true
    await this.socket.send(
      pb.ServerMessage.toBinary(
        {
          id: this.id,
          message: { oneofKind: "streamClosed", streamClosed: {} },
        },
        this.options.binaryOptions
      )
    )
  }
}

class SockRpcServer {
  private readonly methods = new Map<string, MethodInfo<any, any>>()
  private readonly calls = new Map<number, ActiveCall>()
  private state: State
  private user: string | null = null
  private pubkeyChallenge: {
    challenge: Uint8Array
    validate: PubkeyChallengeValidator
  } | null = null

  constructor(
    private readonly socket: WebSocketAdapter,
    private readonly options: ServerOptions
  ) {
    for (const method of options.service.methods) {
      this.methods.set(method.name, method)
    }
    if ("userId" in options.auth) {
      this.state = State.Active
      this.user = options.auth.userId
    } else {
      this.state = State.Auth
    }
  }

  private sendWelcome() {
    const { service, version, auth, binaryOptions } = this.options
    this.socket.send(
      pb.ServerWelcome.toBinary(
        {
          sockrpc: 1,
          service: service.typeName,
          version: version,
          ...("userId" in auth
            ? { ...auth, auth: [] }
            : {
                auth: [
                  ...(auth.guest ? [pb.AuthMode.AUTH_GUEST] : []),
                  ...(auth.token ? [pb.AuthMode.AUTH_TOKEN] : []),
                  ...(auth.pubkey ? [pb.AuthMode.AUTH_PUBKEY] : []),
                ],
              }),
        },
        binaryOptions
      )
    )
  }

  private async handleAuthRequest({
    request,
  }: pb.ClientAuthRequest): Promise<pb.ServerAuthResponse> {
    const { auth } = this.options
    if ("userId" in auth) throw new Error("No auth method configured")
    try {
      switch (request.oneofKind) {
        case "guest":
          return {
            response: auth.guest
              ? { oneofKind: "userId", userId: await auth.guest() }
              : {
                  oneofKind: "error",
                  error: pb.AuthErrorCode.AUTHERR_BAD_MODE,
                },
          }
        case "token":
          if (auth.token) {
            const userId = await auth.token(request.token)
            return {
              response:
                userId != null
                  ? { oneofKind: "userId", userId }
                  : {
                      oneofKind: "error",
                      error: pb.AuthErrorCode.AUTHERR_BAD_CREDENTIAL,
                    },
            }
          }
          return {
            response: {
              oneofKind: "error",
              error: pb.AuthErrorCode.AUTHERR_BAD_MODE,
            },
          }
        case "pubkey":
          if (auth.pubkey) {
            const validate = await auth.pubkey(request.pubkey)
            if (!validate)
              return {
                response: {
                  oneofKind: "error",
                  error: pb.AuthErrorCode.AUTHERR_BAD_CREDENTIAL,
                },
              }
            const challenge = new Uint8Array(32)
            crypto.getRandomValues(challenge)
            this.pubkeyChallenge = { challenge, validate }
            return {
              response: {
                oneofKind: "pubkeyChallenge",
                pubkeyChallenge: challenge,
              },
            }
          }
      }
      return {
        response: {
          oneofKind: "error",
          error: pb.AuthErrorCode.AUTHERR_BAD_MODE,
        },
      }
    } catch (e) {
      console.error(e)
      return {
        response: {
          oneofKind: "error",
          error: pb.AuthErrorCode.AUTHERR_INTERNAL,
        },
      }
    }
  }

  private async *handleCall(
    id: number,
    call: pb.ClientMessage_Call
  ): AsyncGenerator<pb.ServerMessage> {
    const { handlers, binaryOptions } = this.options
    const method = this.methods.get(call.method)
    if (!method || method.clientStreaming) {
      yield {
        id,
        message: {
          oneofKind: "error",
          error: {
            code: pb.ErrorCode.ERR_BAD_METHOD,
            message: `RPC method ${JSON.stringify(call.method)} ${method?.clientStreaming ? "must be called with client streaming" : "does not exist"}`,
          },
        },
      }
      return
    }
    let code = pb.ErrorCode.ERR_BAD_INPUT
    try {
      const request = method.I.fromBinary(call.request, binaryOptions)
      const abort = new AbortController()
      this.calls.set(id, { method, abort })
      const context: SockRpcServerContext = {
        method,
        user: this.user!,
        deadline: call.deadline && Timestamp.toDate(call.deadline),
        abort: abort.signal,
      }
      code = pb.ErrorCode.ERR_USER
      if (method.serverStreaming) {
        const stream = new SockRpcServerStream(
          id,
          method,
          this.socket,
          this.options
        )
        await (handlers[method.localName] as ServerStreamingMethod)(
          request,
          stream,
          context
        )
        code = pb.ErrorCode.ERR_INTERNAL
        if (!stream.closed) stream.complete()
        yield { id, message: { oneofKind: "streamClosed", streamClosed: {} } }
        return
      }
      const response = await (handlers[method.localName] as UnaryMethod)(
        request,
        context
      )
      code = pb.ErrorCode.ERR_INTERNAL
      yield {
        id,
        message: {
          oneofKind: "callResponse",
          callResponse: method.O.toBinary(response, binaryOptions),
        },
      }
    } catch (e: any) {
      yield {
        id,
        message: {
          oneofKind: "error",
          error: { code, message: e.message ?? `${e}` },
        },
      }
    } finally {
      this.calls.delete(id)
    }
  }

  private async *handleCallClientStream(
    id: number,
    call: pb.ClientMessage_CallClientStream
  ): AsyncGenerator<pb.ServerMessage> {
    const { handlers, binaryOptions } = this.options
    const method = this.methods.get(call.method)
    if (!method || !method.clientStreaming) {
      yield {
        id,
        message: {
          oneofKind: "error",
          error: {
            code: pb.ErrorCode.ERR_BAD_METHOD,
            message: `RPC method ${JSON.stringify(call.method)} ${method ? "cannot be called with client streaming" : "does not exist"}`,
          },
        },
      }
      return
    }
    let code = pb.ErrorCode.ERR_BAD_INPUT
    try {
      const abort = new AbortController()
      const outStream = new RpcOutputStreamController<any>()
      this.calls.set(id, { method, abort, outStream })
      const context: SockRpcServerContext = {
        method,
        user: this.user!,
        deadline: call.deadline && Timestamp.toDate(call.deadline),
        abort: abort.signal,
      }
      code = pb.ErrorCode.ERR_USER
      if (method.serverStreaming) {
        const inStream = new SockRpcServerStream(
          id,
          method,
          this.socket,
          this.options
        )
        await (handlers[method.localName] as DuplexStreamingMethod)(
          outStream,
          inStream,
          context
        )
        code = pb.ErrorCode.ERR_INTERNAL
        if (!inStream.closed) inStream.complete()
        if (!outStream.closed) outStream.notifyComplete()
        yield { id, message: { oneofKind: "streamClosed", streamClosed: {} } }
        return
      }
      const response = await (
        handlers[method.localName] as ClientStreamingMethod
      )(outStream, context)
      code = pb.ErrorCode.ERR_INTERNAL
      if (!outStream.closed) outStream.notifyComplete()
      yield {
        id,
        message: {
          oneofKind: "callResponse",
          callResponse: method.O.toBinary(response, binaryOptions),
        },
      }
    } catch (e: any) {
      yield {
        id,
        message: {
          oneofKind: "error",
          error: { code, message: e.message ?? `${e}` },
        },
      }
    } finally {
      this.calls.delete(id)
    }
  }

  private async *handleClientMessage({
    id,
    message,
  }: pb.ClientMessage): AsyncGenerator<pb.ServerMessage> {
    switch (message.oneofKind) {
      case "call":
        yield* this.handleCall(id, message.call)
        break
      case "callClientStream":
        yield* this.handleCallClientStream(id, message.callClientStream)
        break
      case "streamSend":
      case "streamClose": {
        const call = this.calls.get(id)
        if (!call) {
          yield {
            id,
            message: {
              oneofKind: "error",
              error: {
                code: pb.ErrorCode.ERR_BAD_ID,
                message: `No active call with ID ${id}`,
              },
            },
          }
        } else if (!call.outStream) {
          yield {
            id,
            message: {
              oneofKind: "error",
              error: {
                code: pb.ErrorCode.ERR_BAD_STREAM_SEND,
                message: `Active call ${id} does not have a client stream`,
              },
            },
          }
        } else if (call.outStream.closed) {
          yield {
            id,
            message: {
              oneofKind: "error",
              error: {
                code: pb.ErrorCode.ERR_BAD_STREAM_SEND,
                message: `Client stream ${id} is closed`,
              },
            },
          }
        } else if (message.oneofKind == "streamSend") {
          try {
            call.outStream.notifyMessage(
              call.method.I.fromBinary(
                message.streamSend,
                this.options.binaryOptions
              )
            )
          } catch (e: any) {
            yield {
              id,
              message: {
                oneofKind: "error",
                error: {
                  code: pb.ErrorCode.ERR_BAD_STREAM_SEND,
                  message: e.message || `${e}`,
                },
              },
            }
          }
        } else {
          try {
            call.outStream.notifyComplete()
          } catch (e: any) {
            yield {
              id,
              message: {
                oneofKind: "error",
                error: {
                  code: pb.ErrorCode.ERR_INTERNAL,
                  message: e.message || `${e}`,
                },
              },
            }
          }
        }
        break
      }
      case "abort": {
        const call = this.calls.get(id)
        if (!call) {
          yield {
            id,
            message: {
              oneofKind: "error",
              error: {
                code: pb.ErrorCode.ERR_BAD_ID,
                message: `No active call with ID ${id}`,
              },
            },
          }
          return
        }
        call.abort.abort("Abort requested by client")
      }
    }
  }

  private async handleSocketMessage(data: Uint8Array) {
    const { binaryOptions } = this.options
    switch (this.state) {
      case State.Auth: {
        const request = pb.ClientAuthRequest.fromBinary(data, binaryOptions)
        this.state = State.ProcessingAuth
        const r = await this.handleAuthRequest(request)
        this.state = (
          {
            userId: State.Active,
            error: State.Auth,
            pubkeyChallenge: State.PubkeyChallenge,
          } as const
        )[r.response.oneofKind!]
        if (r.response.oneofKind === "userId") this.user = r.response.userId
        this.socket.send(pb.ServerAuthResponse.toBinary(r, binaryOptions))
        break
      }
      case State.ProcessingAuth:
        throw new Error(
          "Unexpected client message while still processing auth request"
        )
      case State.PubkeyChallenge: {
        const response = pb.ClientPubkeyChallengeResponse.fromBinary(
          data,
          binaryOptions
        )
        this.state = State.ProcessingAuth
        const { challenge, validate } = this.pubkeyChallenge!
        this.pubkeyChallenge = null
        let rsp: pb.ServerAuthResponse
        try {
          const userId = await validate({
            challenge,
            signature: response.signature,
          })
          this.state = userId != null ? State.Active : State.Auth
          if (userId) this.user = userId
          rsp = {
            response:
              userId != null
                ? { oneofKind: "userId", userId }
                : {
                    oneofKind: "error",
                    error: pb.AuthErrorCode.AUTHERR_BAD_CREDENTIAL,
                  },
          }
        } catch (e) {
          console.error(e)
          rsp = {
            response: {
              oneofKind: "error",
              error: pb.AuthErrorCode.AUTHERR_INTERNAL,
            },
          }
        }
        this.socket.send(pb.ServerAuthResponse.toBinary(rsp, binaryOptions))
        break
      }
      case State.Active: {
        const message = pb.ClientMessage.fromBinary(data, binaryOptions)
        for await (const response of this.handleClientMessage(message)) {
          this.socket.send(pb.ServerMessage.toBinary(response, binaryOptions))
        }
        break
      }
      case State.Closed:
      // Do nothing
    }
  }

  start() {
    this.socket.onMessage((data) =>
      this.handleSocketMessage(data).catch((e) => {
        console.error(e)
        this.socket.close()
      })
    )
    this.sendWelcome()
  }
}

export function registerSockRpcServer(
  socket: WebSocketAdapter,
  options: ServerOptions
) {
  const server = new SockRpcServer(socket, options)
  server.start()
}

export function ed25519Validator(
  pubkeyToUser: (request: pb.ClientAuthRequest_Pubkey) => Promise<string | null>
): PubkeyValidator {
  return async (request) => {
    let key: CryptoKey
    try {
      key = await crypto.subtle.importKey(
        "raw",
        request.pubkey,
        "Ed25519",
        true,
        ["verify"]
      )
    } catch (_) {
      return null
    }
    const user = await pubkeyToUser(request)
    if (!user) return null
    return async ({ challenge, signature }) => {
      if (await crypto.subtle.verify("Ed25519", key, signature, challenge))
        return user
      return null
    }
  }
}

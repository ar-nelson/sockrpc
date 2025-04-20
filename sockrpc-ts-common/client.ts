import {
  mergeRpcOptions,
  RpcStatus,
  RpcOptions,
  RpcTransport,
  ClientStreamingCall,
  DuplexStreamingCall,
  ServerStreamingCall,
  MethodInfo,
  ServiceInfo,
  UnaryCall,
  RpcMetadata,
  RpcInputStream,
  RpcOutputStreamController,
} from "@protobuf-ts/runtime-rpc"
import * as pb from "./pb/sockrpc.ts"
import { Empty } from "./pb/google/protobuf/empty.ts"
import { WebSocketAdapter } from "./common.ts"

type SignFunction = (challenge: Uint8Array) => Promise<Uint8Array>

export type Auth =
  | {
      readonly auth: "guest"
    }
  | {
      readonly auth: "token"
      readonly token: Uint8Array
    }
  | {
      readonly auth: "pubkey"
      readonly userId: string
      readonly pubkey: Uint8Array
      readonly sign: SignFunction
    }

type AuthFailures = { method: Auth; error: pb.AuthErrorCode }[]

export interface ConnectOptions {
  readonly service: ServiceInfo
  readonly auth: readonly Auth[]
  readonly onAuthFailure?: (failures: AuthFailures) => void
}

enum State {
  BeforeWelcome,
  Auth,
  PubkeyChallenge,
  Active,
  Closed,
}

function authMode(auth: "guest" | "token" | "pubkey"): pb.AuthMode {
  switch (auth) {
    case "guest":
      return pb.AuthMode.AUTH_GUEST
    case "token":
      return pb.AuthMode.AUTH_TOKEN
    case "pubkey":
      return pb.AuthMode.AUTH_PUBKEY
  }
}

const noHeaders: Promise<RpcMetadata> = Promise.resolve(Object.freeze({}))

interface ActiveCall {
  method: MethodInfo<any, any>
  options: RpcOptions
  in?: SockRpcClientStream<any>
  out?: RpcOutputStreamController<any>
  resolve?: (o: any) => void
  reject?: (err: Error) => void
}

class SockRpcClientStream<I extends object> implements RpcInputStream<I> {
  constructor(
    private id: number,
    private socket: WebSocketAdapter,
    private method: MethodInfo<I, any>,
    private options: RpcOptions
  ) {}

  async send(message: I) {
    await this.socket.send(
      pb.ClientMessage.toBinary(
        {
          id: this.id,
          message: {
            oneofKind: "streamSend",
            streamSend: this.method.I.toBinary(
              message,
              this.options.binaryOptions
            ),
          },
        },
        this.options.binaryOptions
      )
    )
  }

  async complete() {
    await this.socket.send(
      pb.ClientMessage.toBinary(
        {
          id: this.id,
          message: {
            oneofKind: "streamClose",
            streamClose: Empty.toBinary({}, this.options.binaryOptions),
          },
        },
        this.options.binaryOptions
      )
    )
  }
}

class SockRpcTransport implements RpcTransport {
  private next = 0
  private calls = new Map<number, ActiveCall>()

  constructor(
    private user: string,
    private socket: WebSocketAdapter
  ) {}

  handleServerMessage({ id, message }: pb.ServerMessage) {
    const call = this.calls.get(id)
    if (!call) {
      console.warn(`Ignoring server message for invalid ID ${id}`)
      return
    }
    try {
      switch (message.oneofKind) {
        case "error":
          // TODO: handle errors correctly
          throw new Error(
            `error code ${message.error.code}: ${message.error.message}`
          )
        case "callResponse":
          if (call.method.serverStreaming) {
            throw new Error(
              "Received invalid unary response to streaming RPC call"
            )
          }
          call.resolve!(
            call.method.O.fromBinary(
              message.callResponse,
              call.options.binaryOptions
            )
          )
          break
        case "streamRecv":
          if (!call.method.serverStreaming) {
            throw new Error(
              "Received invalid server streaming response to unary RPC call"
            )
          }
          call.out!.notifyMessage(
            call.method.O.fromBinary(
              message.streamRecv,
              call.options.binaryOptions
            )
          )
          break
        case "streamClosed":
          call.in?.complete()
          call.out?.notifyComplete()
          break
      }
    } catch (e: any) {
      call.reject?.(e)
      try {
        call.out?.notifyError(e)
      } catch (_) {
        console.warn(`Unable to notify RPC call ${id} of error`)
        console.warn(e)
      }
    }
  }

  abortAll(e: Error) {
    for (const { reject, out } of this.calls.values()) {
      reject?.(e)
      try {
        out?.notifyError(e)
      } catch (_) {
        /* do nothing */
      }
    }
    this.calls.clear()
  }

  mergeOptions(options?: Partial<RpcOptions>): RpcOptions {
    return mergeRpcOptions({}, options)
  }

  unary<I extends object, O extends object>(
    method: MethodInfo<I, O>,
    input: I,
    options: RpcOptions
  ): UnaryCall<I, O> {
    const id = this.next++
    const response = new Promise<O>((resolve, reject) => {
      this.calls.set(id, { method, options, resolve, reject })
    })
    try {
      this.socket.send(
        pb.ClientMessage.toBinary(
          {
            id,
            message: {
              oneofKind: "call",
              call: {
                method: method.name,
                request: method.I.toBinary(input, options.binaryOptions),
              },
            },
          },
          options.binaryOptions
        )
      )
    } catch (e) {
      this.calls.delete(id)
      throw e
    }
    const call = new UnaryCall(
      method,
      { user: this.user },
      input,
      noHeaders,
      response,
      response.then(
        () => ({ code: "ok", detail: "" }),
        (e) => ({ code: "err", detail: `${e}` })
      ),
      noHeaders
    )
    call.status.then(
      () => this.calls.delete(id),
      () => this.calls.delete(id)
    )
    return call
  }

  serverStreaming<I extends object, O extends object>(
    method: MethodInfo<I, O>,
    input: I,
    options: RpcOptions
  ): ServerStreamingCall<I, O> {
    const id = this.next++
    const outputStream = new RpcOutputStreamController<O>()
    const statusPromise = new Promise<RpcStatus>((resolve) => {
      outputStream.onComplete(() => resolve({ code: "ok", detail: "" }))
      outputStream.onError((e) => resolve({ code: "err", detail: `${e}` }))
    })
    this.calls.set(id, { method, options, out: outputStream })
    try {
      this.socket.send(
        pb.ClientMessage.toBinary(
          {
            id,
            message: {
              oneofKind: "call",
              call: {
                method: method.name,
                request: method.I.toBinary(input, options.binaryOptions),
              },
            },
          },
          options.binaryOptions
        )
      )
    } catch (e) {
      this.calls.delete(id)
      throw e
    }
    const call = new ServerStreamingCall<I, O>(
      method,
      { user: this.user },
      input,
      noHeaders,
      outputStream,
      statusPromise,
      noHeaders
    )
    call.status.then(
      () => this.calls.delete(id),
      () => this.calls.delete(id)
    )
    return call
  }

  clientStreaming<I extends object, O extends object>(
    method: MethodInfo<I, O>,
    options: RpcOptions
  ): ClientStreamingCall<I, O> {
    const id = this.next++
    const inputStream = new SockRpcClientStream<I>(
      id,
      this.socket,
      method,
      options
    )
    const response = new Promise<O>((resolve, reject) => {
      this.calls.set(id, { method, options, resolve, reject, in: inputStream })
    })
    try {
      this.socket.send(
        pb.ClientMessage.toBinary(
          {
            id,
            message: {
              oneofKind: "callClientStream",
              callClientStream: {
                method: method.name,
              },
            },
          },
          options.binaryOptions
        )
      )
    } catch (e) {
      this.calls.delete(id)
      throw e
    }
    const call = new ClientStreamingCall<I, O>(
      method,
      { user: this.user },
      inputStream,
      noHeaders,
      response,
      response.then(
        () => ({ code: "ok", detail: "" }),
        (e) => ({ code: "err", detail: `${e}` })
      ),
      noHeaders
    )
    call.status.then(
      () => this.calls.delete(id),
      () => this.calls.delete(id)
    )
    return call
  }

  duplex<I extends object, O extends object>(
    method: MethodInfo<I, O>,
    options: RpcOptions
  ): DuplexStreamingCall<I, O> {
    const id = this.next++
    const outputStream = new RpcOutputStreamController<O>()
    const statusPromise = new Promise<RpcStatus>((resolve) => {
      outputStream.onComplete(() => resolve({ code: "ok", detail: "" }))
      outputStream.onError((e) => resolve({ code: "err", detail: `${e}` }))
    })
    const inputStream = new SockRpcClientStream<I>(
      id,
      this.socket,
      method,
      options
    )
    this.calls.set(id, { method, options, in: inputStream, out: outputStream })
    try {
      this.socket.send(
        pb.ClientMessage.toBinary(
          {
            id,
            message: {
              oneofKind: "callClientStream",
              callClientStream: {
                method: method.name,
              },
            },
          },
          options.binaryOptions
        )
      )
    } catch (e) {
      this.calls.delete(id)
      throw e
    }
    const call = new DuplexStreamingCall<I, O>(
      method,
      { user: this.user },
      new SockRpcClientStream<I>(id, this.socket, method, options),
      noHeaders,
      outputStream,
      statusPromise,
      noHeaders
    )
    call.status.then(
      () => this.calls.delete(id),
      () => this.calls.delete(id)
    )
    return call
  }
}

export function connectSockRpc(
  socket: WebSocketAdapter,
  options: ConnectOptions
): Promise<RpcTransport> {
  let state = State.BeforeWelcome
  const auth = [...options.auth]
  const authFailures: AuthFailures = []
  let lastAuth: Auth | null = null
  let authTypes: pb.AuthMode[] = []
  let resolve: (t: RpcTransport) => void
  let reject: (e: Error) => void
  let transport: SockRpcTransport
  const promise = new Promise<RpcTransport>((resolve_, reject_) => {
    resolve = resolve_
    reject = reject_
  })
  function authenticate() {
    while (auth.length) {
      const nextAuth = auth.pop()!
      if (!authTypes.includes(authMode(nextAuth.auth))) continue
      lastAuth = nextAuth
      state = State.Auth
      switch (nextAuth.auth) {
        case "guest":
          socket.send(
            pb.ClientAuthRequest.toBinary({
              request: { oneofKind: "guest", guest: {} },
            })
          )
          return
        case "token":
          socket.send(
            pb.ClientAuthRequest.toBinary({
              request: { oneofKind: "token", token: nextAuth.token },
            })
          )
          return
        case "pubkey":
          socket.send(
            pb.ClientAuthRequest.toBinary({
              request: {
                oneofKind: "pubkey",
                pubkey: {
                  userId: nextAuth.userId,
                  pubkey: nextAuth.pubkey,
                },
              },
            })
          )
          return
      }
    }
    options.onAuthFailure?.(authFailures)
    throw new Error("Authentication failed")
  }
  socket.onMessage((data) => {
    try {
      switch (state) {
        case State.BeforeWelcome: {
          const welcome = pb.ServerWelcome.fromBinary(data)
          if (welcome.sockrpc > 1)
            throw new Error(
              "Server is using a newer SockRPC version (client version is 1)"
            )
          authTypes = welcome.auth
          if (welcome.userId != null) {
            transport = new SockRpcTransport(welcome.userId, socket)
            state = State.Active
            resolve(transport)
          } else {
            authenticate()
          }
          break
        }
        case State.Auth: {
          const { response } = pb.ServerAuthResponse.fromBinary(data)
          switch (response.oneofKind) {
            case "userId":
              transport = new SockRpcTransport(response.userId, socket)
              state = State.Active
              resolve(transport)
              break
            case "pubkeyChallenge":
              if (lastAuth?.auth === "pubkey") {
                state = State.PubkeyChallenge
                lastAuth.sign(response.pubkeyChallenge).then((signature) => {
                  state = State.Auth
                  socket.send(
                    pb.ClientPubkeyChallengeResponse.toBinary({ signature })
                  )
                })
              } else {
                throw new Error(
                  "Pubkey challenge auth is in invalid state (internal error)"
                )
              }
              break
            case "error":
              authFailures.push({ method: lastAuth!, error: response.error })
              authenticate()
              break
          }
          break
        }
        case State.PubkeyChallenge:
          throw new Error(
            "Got unexpected message while preparing pubkey challenge response"
          )
        case State.Active: {
          const message = pb.ServerMessage.fromBinary(data)
          transport.handleServerMessage(message)
          break
        }
        case State.Closed:
        // Do nothing
      }
    } catch (e: any) {
      switch (state) {
        case State.BeforeWelcome:
        case State.Auth:
        case State.PubkeyChallenge:
          reject(e)
          state = State.Closed
          break
        default:
      }
      console.error(e)
      socket.close()
    }
  })
  socket.onClose(() => {
    switch (state) {
      case State.BeforeWelcome:
      case State.Auth:
      case State.PubkeyChallenge:
        reject(new Error("Socket closed"))
        break
      case State.Active:
        transport.abortAll(new Error("Socket closed"))
        break
      default:
    }
    state = State.Closed
  })
  return promise
}

export function ed25519Signer(privateKey: CryptoKey): SignFunction {
  return async (challenge: Uint8Array) => {
    const buffer = await crypto.subtle.sign("Ed25519", privateKey, challenge)
    return new Uint8Array(buffer)
  }
}

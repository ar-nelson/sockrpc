import { RpcOutputStreamController, } from "@protobuf-ts/runtime-rpc";
import * as pb from "./pb/sockrpc.js";
import { Timestamp } from "./pb/google/protobuf/timestamp.js";
var State;
(function (State) {
    State[State["Auth"] = 0] = "Auth";
    State[State["ProcessingAuth"] = 1] = "ProcessingAuth";
    State[State["PubkeyChallenge"] = 2] = "PubkeyChallenge";
    State[State["Active"] = 3] = "Active";
    State[State["Closed"] = 4] = "Closed";
})(State || (State = {}));
class SockRpcServerStream {
    id;
    method;
    socket;
    options;
    closed = false;
    constructor(id, method, socket, options) {
        this.id = id;
        this.method = method;
        this.socket = socket;
        this.options = options;
    }
    async send(value) {
        if (this.closed)
            throw new Error("Server stream is closed");
        await this.socket.send(pb.ServerMessage.toBinary({
            id: this.id,
            message: {
                oneofKind: "streamRecv",
                streamRecv: this.method.O.toBinary(value, this.options.binaryOptions),
            },
        }, this.options.binaryOptions));
    }
    async complete() {
        if (this.closed)
            throw new Error("Server stream is closed");
        this.closed = true;
        await this.socket.send(pb.ServerMessage.toBinary({
            id: this.id,
            message: { oneofKind: "streamClosed", streamClosed: {} },
        }, this.options.binaryOptions));
    }
}
class SockRpcServer {
    socket;
    options;
    methods = new Map();
    calls = new Map();
    state;
    user = null;
    pubkeyChallenge = null;
    constructor(socket, options) {
        this.socket = socket;
        this.options = options;
        for (const method of options.service.methods) {
            this.methods.set(method.name, method);
        }
        if ("userId" in options.auth) {
            this.state = State.Active;
            this.user = options.auth.userId;
        }
        else {
            this.state = State.Auth;
        }
    }
    sendWelcome() {
        const { service, version, auth, binaryOptions } = this.options;
        this.socket.send(pb.ServerWelcome.toBinary({
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
        }, binaryOptions));
    }
    async handleAuthRequest({ request, }) {
        const { auth } = this.options;
        if ("userId" in auth)
            throw new Error("No auth method configured");
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
                    };
                case "token":
                    if (auth.token) {
                        const userId = await auth.token(request.token);
                        return {
                            response: userId != null
                                ? { oneofKind: "userId", userId }
                                : {
                                    oneofKind: "error",
                                    error: pb.AuthErrorCode.AUTHERR_BAD_CREDENTIAL,
                                },
                        };
                    }
                    return {
                        response: {
                            oneofKind: "error",
                            error: pb.AuthErrorCode.AUTHERR_BAD_MODE,
                        },
                    };
                case "pubkey":
                    if (auth.pubkey) {
                        const validate = await auth.pubkey(request.pubkey);
                        if (!validate)
                            return {
                                response: {
                                    oneofKind: "error",
                                    error: pb.AuthErrorCode.AUTHERR_BAD_CREDENTIAL,
                                },
                            };
                        const challenge = new Uint8Array(32);
                        crypto.getRandomValues(challenge);
                        this.pubkeyChallenge = { challenge, validate };
                        return {
                            response: {
                                oneofKind: "pubkeyChallenge",
                                pubkeyChallenge: challenge,
                            },
                        };
                    }
            }
            return {
                response: {
                    oneofKind: "error",
                    error: pb.AuthErrorCode.AUTHERR_BAD_MODE,
                },
            };
        }
        catch (e) {
            console.error(e);
            return {
                response: {
                    oneofKind: "error",
                    error: pb.AuthErrorCode.AUTHERR_INTERNAL,
                },
            };
        }
    }
    async *handleCall(id, call) {
        const { handlers, binaryOptions } = this.options;
        const method = this.methods.get(call.method);
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
            };
            return;
        }
        let code = pb.ErrorCode.ERR_BAD_INPUT;
        try {
            const request = method.I.fromBinary(call.request, binaryOptions);
            const abort = new AbortController();
            this.calls.set(id, { method, abort });
            const context = {
                method,
                user: this.user,
                deadline: call.deadline && Timestamp.toDate(call.deadline),
                abort: abort.signal,
            };
            code = pb.ErrorCode.ERR_USER;
            if (method.serverStreaming) {
                const stream = new SockRpcServerStream(id, method, this.socket, this.options);
                await handlers[method.localName](request, stream, context);
                code = pb.ErrorCode.ERR_INTERNAL;
                if (!stream.closed)
                    stream.complete();
                yield { id, message: { oneofKind: "streamClosed", streamClosed: {} } };
                return;
            }
            const response = await handlers[method.localName](request, context);
            code = pb.ErrorCode.ERR_INTERNAL;
            yield {
                id,
                message: {
                    oneofKind: "callResponse",
                    callResponse: method.O.toBinary(response, binaryOptions),
                },
            };
        }
        catch (e) {
            yield {
                id,
                message: {
                    oneofKind: "error",
                    error: { code, message: e.message ?? `${e}` },
                },
            };
        }
        finally {
            this.calls.delete(id);
        }
    }
    async *handleCallClientStream(id, call) {
        const { handlers, binaryOptions } = this.options;
        const method = this.methods.get(call.method);
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
            };
            return;
        }
        let code = pb.ErrorCode.ERR_BAD_INPUT;
        try {
            const abort = new AbortController();
            const outStream = new RpcOutputStreamController();
            this.calls.set(id, { method, abort, outStream });
            const context = {
                method,
                user: this.user,
                deadline: call.deadline && Timestamp.toDate(call.deadline),
                abort: abort.signal,
            };
            code = pb.ErrorCode.ERR_USER;
            if (method.serverStreaming) {
                const inStream = new SockRpcServerStream(id, method, this.socket, this.options);
                await handlers[method.localName](outStream, inStream, context);
                code = pb.ErrorCode.ERR_INTERNAL;
                if (!inStream.closed)
                    inStream.complete();
                if (!outStream.closed)
                    outStream.notifyComplete();
                yield { id, message: { oneofKind: "streamClosed", streamClosed: {} } };
                return;
            }
            const response = await handlers[method.localName](outStream, context);
            code = pb.ErrorCode.ERR_INTERNAL;
            if (!outStream.closed)
                outStream.notifyComplete();
            yield {
                id,
                message: {
                    oneofKind: "callResponse",
                    callResponse: method.O.toBinary(response, binaryOptions),
                },
            };
        }
        catch (e) {
            yield {
                id,
                message: {
                    oneofKind: "error",
                    error: { code, message: e.message ?? `${e}` },
                },
            };
        }
        finally {
            this.calls.delete(id);
        }
    }
    async *handleClientMessage({ id, message, }) {
        switch (message.oneofKind) {
            case "call":
                yield* this.handleCall(id, message.call);
                break;
            case "callClientStream":
                yield* this.handleCallClientStream(id, message.callClientStream);
                break;
            case "streamSend":
            case "streamClose": {
                const call = this.calls.get(id);
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
                    };
                }
                else if (!call.outStream) {
                    yield {
                        id,
                        message: {
                            oneofKind: "error",
                            error: {
                                code: pb.ErrorCode.ERR_BAD_STREAM_SEND,
                                message: `Active call ${id} does not have a client stream`,
                            },
                        },
                    };
                }
                else if (call.outStream.closed) {
                    yield {
                        id,
                        message: {
                            oneofKind: "error",
                            error: {
                                code: pb.ErrorCode.ERR_BAD_STREAM_SEND,
                                message: `Client stream ${id} is closed`,
                            },
                        },
                    };
                }
                else if (message.oneofKind == "streamSend") {
                    try {
                        call.outStream.notifyMessage(call.method.I.fromBinary(message.streamSend, this.options.binaryOptions));
                    }
                    catch (e) {
                        yield {
                            id,
                            message: {
                                oneofKind: "error",
                                error: {
                                    code: pb.ErrorCode.ERR_BAD_STREAM_SEND,
                                    message: e.message || `${e}`,
                                },
                            },
                        };
                    }
                }
                else {
                    try {
                        call.outStream.notifyComplete();
                    }
                    catch (e) {
                        yield {
                            id,
                            message: {
                                oneofKind: "error",
                                error: {
                                    code: pb.ErrorCode.ERR_INTERNAL,
                                    message: e.message || `${e}`,
                                },
                            },
                        };
                    }
                }
                break;
            }
            case "abort": {
                const call = this.calls.get(id);
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
                    };
                    return;
                }
                call.abort.abort("Abort requested by client");
            }
        }
    }
    async handleSocketMessage(data) {
        const { binaryOptions } = this.options;
        switch (this.state) {
            case State.Auth: {
                const request = pb.ClientAuthRequest.fromBinary(data, binaryOptions);
                this.state = State.ProcessingAuth;
                const r = await this.handleAuthRequest(request);
                this.state = {
                    userId: State.Active,
                    error: State.Auth,
                    pubkeyChallenge: State.PubkeyChallenge,
                }[r.response.oneofKind];
                if (r.response.oneofKind === "userId")
                    this.user = r.response.userId;
                this.socket.send(pb.ServerAuthResponse.toBinary(r, binaryOptions));
                break;
            }
            case State.ProcessingAuth:
                throw new Error("Unexpected client message while still processing auth request");
            case State.PubkeyChallenge: {
                const response = pb.ClientPubkeyChallengeResponse.fromBinary(data, binaryOptions);
                this.state = State.ProcessingAuth;
                const { challenge, validate } = this.pubkeyChallenge;
                this.pubkeyChallenge = null;
                let rsp;
                try {
                    const userId = await validate({
                        challenge,
                        signature: response.signature,
                    });
                    this.state = userId != null ? State.Active : State.Auth;
                    if (userId)
                        this.user = userId;
                    rsp = {
                        response: userId != null
                            ? { oneofKind: "userId", userId }
                            : {
                                oneofKind: "error",
                                error: pb.AuthErrorCode.AUTHERR_BAD_CREDENTIAL,
                            },
                    };
                }
                catch (e) {
                    console.error(e);
                    rsp = {
                        response: {
                            oneofKind: "error",
                            error: pb.AuthErrorCode.AUTHERR_INTERNAL,
                        },
                    };
                }
                this.socket.send(pb.ServerAuthResponse.toBinary(rsp, binaryOptions));
                break;
            }
            case State.Active: {
                const message = pb.ClientMessage.fromBinary(data, binaryOptions);
                for await (const response of this.handleClientMessage(message)) {
                    this.socket.send(pb.ServerMessage.toBinary(response, binaryOptions));
                }
                break;
            }
            case State.Closed:
            // Do nothing
        }
    }
    start() {
        this.socket.onMessage((data) => this.handleSocketMessage(data).catch((e) => {
            console.error(e);
            this.socket.close();
        }));
        this.sendWelcome();
    }
}
export function registerSockRpcServer(socket, options) {
    const server = new SockRpcServer(socket, options);
    server.start();
}
export function ed25519Validator(pubkeyToUser) {
    return async (request) => {
        let key;
        try {
            key = await crypto.subtle.importKey("raw", request.pubkey, "Ed25519", true, ["verify"]);
        }
        catch (_) {
            return null;
        }
        const user = await pubkeyToUser(request);
        if (!user)
            return null;
        return async ({ challenge, signature }) => {
            if (await crypto.subtle.verify("Ed25519", key, signature, challenge))
                return user;
            return null;
        };
    };
}
//# sourceMappingURL=server.js.map
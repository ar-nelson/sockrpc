import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
import { Timestamp } from "./google/protobuf/timestamp.js";
import { Empty } from "./google/protobuf/empty.js";
/**
 * @generated from protobuf enum AuthMode
 */
export var AuthMode;
(function (AuthMode) {
    /**
     * @generated from protobuf enum value: AUTH_GUEST = 0;
     */
    AuthMode[AuthMode["AUTH_GUEST"] = 0] = "AUTH_GUEST";
    /**
     * @generated from protobuf enum value: AUTH_TOKEN = 1;
     */
    AuthMode[AuthMode["AUTH_TOKEN"] = 1] = "AUTH_TOKEN";
    /**
     * @generated from protobuf enum value: AUTH_PUBKEY = 2;
     */
    AuthMode[AuthMode["AUTH_PUBKEY"] = 2] = "AUTH_PUBKEY";
})(AuthMode || (AuthMode = {}));
/**
 * @generated from protobuf enum AuthErrorCode
 */
export var AuthErrorCode;
(function (AuthErrorCode) {
    /**
     * @generated from protobuf enum value: AUTHERR_INTERNAL = 0;
     */
    AuthErrorCode[AuthErrorCode["AUTHERR_INTERNAL"] = 0] = "AUTHERR_INTERNAL";
    /**
     * @generated from protobuf enum value: AUTHERR_BAD_MODE = 1;
     */
    AuthErrorCode[AuthErrorCode["AUTHERR_BAD_MODE"] = 1] = "AUTHERR_BAD_MODE";
    /**
     * @generated from protobuf enum value: AUTHERR_BAD_CREDENTIAL = 2;
     */
    AuthErrorCode[AuthErrorCode["AUTHERR_BAD_CREDENTIAL"] = 2] = "AUTHERR_BAD_CREDENTIAL";
    /**
     * @generated from protobuf enum value: AUTHERR_RATE_LIMITED = 3;
     */
    AuthErrorCode[AuthErrorCode["AUTHERR_RATE_LIMITED"] = 3] = "AUTHERR_RATE_LIMITED";
    /**
     * @generated from protobuf enum value: AUTHERR_USER_BANNED = 4;
     */
    AuthErrorCode[AuthErrorCode["AUTHERR_USER_BANNED"] = 4] = "AUTHERR_USER_BANNED";
})(AuthErrorCode || (AuthErrorCode = {}));
/**
 * @generated from protobuf enum ErrorCode
 */
export var ErrorCode;
(function (ErrorCode) {
    /**
     * @generated from protobuf enum value: ERR_INTERNAL = 0;
     */
    ErrorCode[ErrorCode["ERR_INTERNAL"] = 0] = "ERR_INTERNAL";
    /**
     * @generated from protobuf enum value: ERR_BAD_ID = 1;
     */
    ErrorCode[ErrorCode["ERR_BAD_ID"] = 1] = "ERR_BAD_ID";
    /**
     * @generated from protobuf enum value: ERR_BAD_METHOD = 2;
     */
    ErrorCode[ErrorCode["ERR_BAD_METHOD"] = 2] = "ERR_BAD_METHOD";
    /**
     * @generated from protobuf enum value: ERR_BAD_INPUT = 3;
     */
    ErrorCode[ErrorCode["ERR_BAD_INPUT"] = 3] = "ERR_BAD_INPUT";
    /**
     * @generated from protobuf enum value: ERR_BAD_STREAM_SEND = 4;
     */
    ErrorCode[ErrorCode["ERR_BAD_STREAM_SEND"] = 4] = "ERR_BAD_STREAM_SEND";
    /**
     * @generated from protobuf enum value: ERR_STREAM_CLOSED = 5;
     */
    ErrorCode[ErrorCode["ERR_STREAM_CLOSED"] = 5] = "ERR_STREAM_CLOSED";
    /**
     * @generated from protobuf enum value: ERR_RATE_LIMITED = 6;
     */
    ErrorCode[ErrorCode["ERR_RATE_LIMITED"] = 6] = "ERR_RATE_LIMITED";
    /**
     * @generated from protobuf enum value: ERR_NOT_AUTHORIZED = 7;
     */
    ErrorCode[ErrorCode["ERR_NOT_AUTHORIZED"] = 7] = "ERR_NOT_AUTHORIZED";
    /**
     * @generated from protobuf enum value: ERR_USER = 8;
     */
    ErrorCode[ErrorCode["ERR_USER"] = 8] = "ERR_USER";
})(ErrorCode || (ErrorCode = {}));
// @generated message type with reflection information, may provide speed optimized methods
class ServerWelcome$Type extends MessageType {
    constructor() {
        super("ServerWelcome", [
            { no: 1, name: "sockrpc", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 2, name: "service", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "version", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "userId", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "auth", kind: "enum", repeat: 1 /*RepeatType.PACKED*/, T: () => ["AuthMode", AuthMode] }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.sockrpc = 0;
        message.service = "";
        message.auth = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* uint32 sockrpc */ 1:
                    message.sockrpc = reader.uint32();
                    break;
                case /* string service */ 2:
                    message.service = reader.string();
                    break;
                case /* optional string version */ 3:
                    message.version = reader.string();
                    break;
                case /* optional string userId */ 4:
                    message.userId = reader.string();
                    break;
                case /* repeated AuthMode auth */ 5:
                    if (wireType === WireType.LengthDelimited)
                        for (let e = reader.int32() + reader.pos; reader.pos < e;)
                            message.auth.push(reader.int32());
                    else
                        message.auth.push(reader.int32());
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* uint32 sockrpc = 1; */
        if (message.sockrpc !== 0)
            writer.tag(1, WireType.Varint).uint32(message.sockrpc);
        /* string service = 2; */
        if (message.service !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.service);
        /* optional string version = 3; */
        if (message.version !== undefined)
            writer.tag(3, WireType.LengthDelimited).string(message.version);
        /* optional string userId = 4; */
        if (message.userId !== undefined)
            writer.tag(4, WireType.LengthDelimited).string(message.userId);
        /* repeated AuthMode auth = 5; */
        if (message.auth.length) {
            writer.tag(5, WireType.LengthDelimited).fork();
            for (let i = 0; i < message.auth.length; i++)
                writer.int32(message.auth[i]);
            writer.join();
        }
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ServerWelcome
 */
export const ServerWelcome = new ServerWelcome$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ClientAuthRequest$Type extends MessageType {
    constructor() {
        super("ClientAuthRequest", [
            { no: 1, name: "guest", kind: "message", oneof: "request", T: () => Empty },
            { no: 2, name: "token", kind: "scalar", oneof: "request", T: 12 /*ScalarType.BYTES*/ },
            { no: 3, name: "pubkey", kind: "message", oneof: "request", T: () => ClientAuthRequest_Pubkey }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.request = { oneofKind: undefined };
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* google.protobuf.Empty guest */ 1:
                    message.request = {
                        oneofKind: "guest",
                        guest: Empty.internalBinaryRead(reader, reader.uint32(), options, message.request.guest)
                    };
                    break;
                case /* bytes token */ 2:
                    message.request = {
                        oneofKind: "token",
                        token: reader.bytes()
                    };
                    break;
                case /* ClientAuthRequest.Pubkey pubkey */ 3:
                    message.request = {
                        oneofKind: "pubkey",
                        pubkey: ClientAuthRequest_Pubkey.internalBinaryRead(reader, reader.uint32(), options, message.request.pubkey)
                    };
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* google.protobuf.Empty guest = 1; */
        if (message.request.oneofKind === "guest")
            Empty.internalBinaryWrite(message.request.guest, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        /* bytes token = 2; */
        if (message.request.oneofKind === "token")
            writer.tag(2, WireType.LengthDelimited).bytes(message.request.token);
        /* ClientAuthRequest.Pubkey pubkey = 3; */
        if (message.request.oneofKind === "pubkey")
            ClientAuthRequest_Pubkey.internalBinaryWrite(message.request.pubkey, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ClientAuthRequest
 */
export const ClientAuthRequest = new ClientAuthRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ClientAuthRequest_Pubkey$Type extends MessageType {
    constructor() {
        super("ClientAuthRequest.Pubkey", [
            { no: 1, name: "userId", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "pubkey", kind: "scalar", T: 12 /*ScalarType.BYTES*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.userId = "";
        message.pubkey = new Uint8Array(0);
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string userId */ 1:
                    message.userId = reader.string();
                    break;
                case /* bytes pubkey */ 2:
                    message.pubkey = reader.bytes();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string userId = 1; */
        if (message.userId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.userId);
        /* bytes pubkey = 2; */
        if (message.pubkey.length)
            writer.tag(2, WireType.LengthDelimited).bytes(message.pubkey);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ClientAuthRequest.Pubkey
 */
export const ClientAuthRequest_Pubkey = new ClientAuthRequest_Pubkey$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ServerAuthResponse$Type extends MessageType {
    constructor() {
        super("ServerAuthResponse", [
            { no: 1, name: "userId", kind: "scalar", oneof: "response", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "error", kind: "enum", oneof: "response", T: () => ["AuthErrorCode", AuthErrorCode] },
            { no: 3, name: "pubkeyChallenge", kind: "scalar", oneof: "response", T: 12 /*ScalarType.BYTES*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.response = { oneofKind: undefined };
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string userId */ 1:
                    message.response = {
                        oneofKind: "userId",
                        userId: reader.string()
                    };
                    break;
                case /* AuthErrorCode error */ 2:
                    message.response = {
                        oneofKind: "error",
                        error: reader.int32()
                    };
                    break;
                case /* bytes pubkeyChallenge */ 3:
                    message.response = {
                        oneofKind: "pubkeyChallenge",
                        pubkeyChallenge: reader.bytes()
                    };
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string userId = 1; */
        if (message.response.oneofKind === "userId")
            writer.tag(1, WireType.LengthDelimited).string(message.response.userId);
        /* AuthErrorCode error = 2; */
        if (message.response.oneofKind === "error")
            writer.tag(2, WireType.Varint).int32(message.response.error);
        /* bytes pubkeyChallenge = 3; */
        if (message.response.oneofKind === "pubkeyChallenge")
            writer.tag(3, WireType.LengthDelimited).bytes(message.response.pubkeyChallenge);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ServerAuthResponse
 */
export const ServerAuthResponse = new ServerAuthResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ClientPubkeyChallengeResponse$Type extends MessageType {
    constructor() {
        super("ClientPubkeyChallengeResponse", [
            { no: 1, name: "signature", kind: "scalar", T: 12 /*ScalarType.BYTES*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.signature = new Uint8Array(0);
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* bytes signature */ 1:
                    message.signature = reader.bytes();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* bytes signature = 1; */
        if (message.signature.length)
            writer.tag(1, WireType.LengthDelimited).bytes(message.signature);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ClientPubkeyChallengeResponse
 */
export const ClientPubkeyChallengeResponse = new ClientPubkeyChallengeResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ClientMessage$Type extends MessageType {
    constructor() {
        super("ClientMessage", [
            { no: 1, name: "id", kind: "scalar", T: 4 /*ScalarType.UINT64*/, L: 2 /*LongType.NUMBER*/ },
            { no: 2, name: "call", kind: "message", oneof: "message", T: () => ClientMessage_Call },
            { no: 3, name: "callClientStream", kind: "message", oneof: "message", T: () => ClientMessage_CallClientStream },
            { no: 4, name: "streamSend", kind: "scalar", oneof: "message", T: 12 /*ScalarType.BYTES*/ },
            { no: 5, name: "streamClose", kind: "message", oneof: "message", T: () => Empty },
            { no: 6, name: "abort", kind: "message", oneof: "message", T: () => Empty }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = 0;
        message.message = { oneofKind: undefined };
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* uint64 id */ 1:
                    message.id = reader.uint64().toNumber();
                    break;
                case /* ClientMessage.Call call */ 2:
                    message.message = {
                        oneofKind: "call",
                        call: ClientMessage_Call.internalBinaryRead(reader, reader.uint32(), options, message.message.call)
                    };
                    break;
                case /* ClientMessage.CallClientStream callClientStream */ 3:
                    message.message = {
                        oneofKind: "callClientStream",
                        callClientStream: ClientMessage_CallClientStream.internalBinaryRead(reader, reader.uint32(), options, message.message.callClientStream)
                    };
                    break;
                case /* bytes streamSend */ 4:
                    message.message = {
                        oneofKind: "streamSend",
                        streamSend: reader.bytes()
                    };
                    break;
                case /* google.protobuf.Empty streamClose */ 5:
                    message.message = {
                        oneofKind: "streamClose",
                        streamClose: Empty.internalBinaryRead(reader, reader.uint32(), options, message.message.streamClose)
                    };
                    break;
                case /* google.protobuf.Empty abort */ 6:
                    message.message = {
                        oneofKind: "abort",
                        abort: Empty.internalBinaryRead(reader, reader.uint32(), options, message.message.abort)
                    };
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* uint64 id = 1; */
        if (message.id !== 0)
            writer.tag(1, WireType.Varint).uint64(message.id);
        /* ClientMessage.Call call = 2; */
        if (message.message.oneofKind === "call")
            ClientMessage_Call.internalBinaryWrite(message.message.call, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        /* ClientMessage.CallClientStream callClientStream = 3; */
        if (message.message.oneofKind === "callClientStream")
            ClientMessage_CallClientStream.internalBinaryWrite(message.message.callClientStream, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        /* bytes streamSend = 4; */
        if (message.message.oneofKind === "streamSend")
            writer.tag(4, WireType.LengthDelimited).bytes(message.message.streamSend);
        /* google.protobuf.Empty streamClose = 5; */
        if (message.message.oneofKind === "streamClose")
            Empty.internalBinaryWrite(message.message.streamClose, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
        /* google.protobuf.Empty abort = 6; */
        if (message.message.oneofKind === "abort")
            Empty.internalBinaryWrite(message.message.abort, writer.tag(6, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ClientMessage
 */
export const ClientMessage = new ClientMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ClientMessage_Call$Type extends MessageType {
    constructor() {
        super("ClientMessage.Call", [
            { no: 1, name: "method", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "request", kind: "scalar", T: 12 /*ScalarType.BYTES*/ },
            { no: 3, name: "deadline", kind: "message", T: () => Timestamp }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.method = "";
        message.request = new Uint8Array(0);
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string method */ 1:
                    message.method = reader.string();
                    break;
                case /* bytes request */ 2:
                    message.request = reader.bytes();
                    break;
                case /* optional google.protobuf.Timestamp deadline */ 3:
                    message.deadline = Timestamp.internalBinaryRead(reader, reader.uint32(), options, message.deadline);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string method = 1; */
        if (message.method !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.method);
        /* bytes request = 2; */
        if (message.request.length)
            writer.tag(2, WireType.LengthDelimited).bytes(message.request);
        /* optional google.protobuf.Timestamp deadline = 3; */
        if (message.deadline)
            Timestamp.internalBinaryWrite(message.deadline, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ClientMessage.Call
 */
export const ClientMessage_Call = new ClientMessage_Call$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ClientMessage_CallClientStream$Type extends MessageType {
    constructor() {
        super("ClientMessage.CallClientStream", [
            { no: 1, name: "method", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "deadline", kind: "message", T: () => Timestamp }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.method = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string method */ 1:
                    message.method = reader.string();
                    break;
                case /* optional google.protobuf.Timestamp deadline */ 2:
                    message.deadline = Timestamp.internalBinaryRead(reader, reader.uint32(), options, message.deadline);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string method = 1; */
        if (message.method !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.method);
        /* optional google.protobuf.Timestamp deadline = 2; */
        if (message.deadline)
            Timestamp.internalBinaryWrite(message.deadline, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ClientMessage.CallClientStream
 */
export const ClientMessage_CallClientStream = new ClientMessage_CallClientStream$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ServerMessage$Type extends MessageType {
    constructor() {
        super("ServerMessage", [
            { no: 1, name: "id", kind: "scalar", T: 4 /*ScalarType.UINT64*/, L: 2 /*LongType.NUMBER*/ },
            { no: 2, name: "error", kind: "message", oneof: "message", T: () => ServerMessage_Error },
            { no: 3, name: "callResponse", kind: "scalar", oneof: "message", T: 12 /*ScalarType.BYTES*/ },
            { no: 4, name: "streamRecv", kind: "scalar", oneof: "message", T: 12 /*ScalarType.BYTES*/ },
            { no: 5, name: "streamClosed", kind: "message", oneof: "message", T: () => Empty }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = 0;
        message.message = { oneofKind: undefined };
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* uint64 id */ 1:
                    message.id = reader.uint64().toNumber();
                    break;
                case /* ServerMessage.Error error */ 2:
                    message.message = {
                        oneofKind: "error",
                        error: ServerMessage_Error.internalBinaryRead(reader, reader.uint32(), options, message.message.error)
                    };
                    break;
                case /* bytes callResponse */ 3:
                    message.message = {
                        oneofKind: "callResponse",
                        callResponse: reader.bytes()
                    };
                    break;
                case /* bytes streamRecv */ 4:
                    message.message = {
                        oneofKind: "streamRecv",
                        streamRecv: reader.bytes()
                    };
                    break;
                case /* google.protobuf.Empty streamClosed */ 5:
                    message.message = {
                        oneofKind: "streamClosed",
                        streamClosed: Empty.internalBinaryRead(reader, reader.uint32(), options, message.message.streamClosed)
                    };
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* uint64 id = 1; */
        if (message.id !== 0)
            writer.tag(1, WireType.Varint).uint64(message.id);
        /* ServerMessage.Error error = 2; */
        if (message.message.oneofKind === "error")
            ServerMessage_Error.internalBinaryWrite(message.message.error, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        /* bytes callResponse = 3; */
        if (message.message.oneofKind === "callResponse")
            writer.tag(3, WireType.LengthDelimited).bytes(message.message.callResponse);
        /* bytes streamRecv = 4; */
        if (message.message.oneofKind === "streamRecv")
            writer.tag(4, WireType.LengthDelimited).bytes(message.message.streamRecv);
        /* google.protobuf.Empty streamClosed = 5; */
        if (message.message.oneofKind === "streamClosed")
            Empty.internalBinaryWrite(message.message.streamClosed, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ServerMessage
 */
export const ServerMessage = new ServerMessage$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ServerMessage_Error$Type extends MessageType {
    constructor() {
        super("ServerMessage.Error", [
            { no: 1, name: "code", kind: "enum", T: () => ["ErrorCode", ErrorCode] },
            { no: 2, name: "message", kind: "scalar", opt: true, T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "userErrorCode", kind: "scalar", opt: true, T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.code = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* ErrorCode code */ 1:
                    message.code = reader.int32();
                    break;
                case /* optional string message */ 2:
                    message.message = reader.string();
                    break;
                case /* optional uint32 userErrorCode */ 3:
                    message.userErrorCode = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* ErrorCode code = 1; */
        if (message.code !== 0)
            writer.tag(1, WireType.Varint).int32(message.code);
        /* optional string message = 2; */
        if (message.message !== undefined)
            writer.tag(2, WireType.LengthDelimited).string(message.message);
        /* optional uint32 userErrorCode = 3; */
        if (message.userErrorCode !== undefined)
            writer.tag(3, WireType.Varint).uint32(message.userErrorCode);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ServerMessage.Error
 */
export const ServerMessage_Error = new ServerMessage_Error$Type();
//# sourceMappingURL=sockrpc.js.map
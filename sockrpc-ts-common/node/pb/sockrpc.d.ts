import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
import { Timestamp } from "./google/protobuf/timestamp.ts";
import { Empty } from "./google/protobuf/empty.ts";
/**
 * @generated from protobuf message ServerWelcome
 */
export interface ServerWelcome {
    /**
     * @generated from protobuf field: uint32 sockrpc = 1;
     */
    sockrpc: number;
    /**
     * @generated from protobuf field: string service = 2;
     */
    service: string;
    /**
     * @generated from protobuf field: optional string version = 3;
     */
    version?: string;
    /**
     * @generated from protobuf field: optional string userId = 4;
     */
    userId?: string;
    /**
     * @generated from protobuf field: repeated AuthMode auth = 5;
     */
    auth: AuthMode[];
}
/**
 * @generated from protobuf message ClientAuthRequest
 */
export interface ClientAuthRequest {
    /**
     * @generated from protobuf oneof: request
     */
    request: {
        oneofKind: "guest";
        /**
         * @generated from protobuf field: google.protobuf.Empty guest = 1;
         */
        guest: Empty;
    } | {
        oneofKind: "token";
        /**
         * @generated from protobuf field: bytes token = 2;
         */
        token: Uint8Array;
    } | {
        oneofKind: "pubkey";
        /**
         * @generated from protobuf field: ClientAuthRequest.Pubkey pubkey = 3;
         */
        pubkey: ClientAuthRequest_Pubkey;
    } | {
        oneofKind: undefined;
    };
}
/**
 * @generated from protobuf message ClientAuthRequest.Pubkey
 */
export interface ClientAuthRequest_Pubkey {
    /**
     * @generated from protobuf field: string userId = 1;
     */
    userId: string;
    /**
     * @generated from protobuf field: bytes pubkey = 2;
     */
    pubkey: Uint8Array;
}
/**
 * @generated from protobuf message ServerAuthResponse
 */
export interface ServerAuthResponse {
    /**
     * @generated from protobuf oneof: response
     */
    response: {
        oneofKind: "userId";
        /**
         * @generated from protobuf field: string userId = 1;
         */
        userId: string;
    } | {
        oneofKind: "error";
        /**
         * @generated from protobuf field: AuthErrorCode error = 2;
         */
        error: AuthErrorCode;
    } | {
        oneofKind: "pubkeyChallenge";
        /**
         * @generated from protobuf field: bytes pubkeyChallenge = 3;
         */
        pubkeyChallenge: Uint8Array;
    } | {
        oneofKind: undefined;
    };
}
/**
 * @generated from protobuf message ClientPubkeyChallengeResponse
 */
export interface ClientPubkeyChallengeResponse {
    /**
     * @generated from protobuf field: bytes signature = 1;
     */
    signature: Uint8Array;
}
/**
 * @generated from protobuf message ClientMessage
 */
export interface ClientMessage {
    /**
     * @generated from protobuf field: uint64 id = 1;
     */
    id: number;
    /**
     * @generated from protobuf oneof: message
     */
    message: {
        oneofKind: "call";
        /**
         * @generated from protobuf field: ClientMessage.Call call = 2;
         */
        call: ClientMessage_Call;
    } | {
        oneofKind: "callClientStream";
        /**
         * @generated from protobuf field: ClientMessage.CallClientStream callClientStream = 3;
         */
        callClientStream: ClientMessage_CallClientStream;
    } | {
        oneofKind: "streamSend";
        /**
         * @generated from protobuf field: bytes streamSend = 4;
         */
        streamSend: Uint8Array;
    } | {
        oneofKind: "streamClose";
        /**
         * @generated from protobuf field: google.protobuf.Empty streamClose = 5;
         */
        streamClose: Empty;
    } | {
        oneofKind: "abort";
        /**
         * @generated from protobuf field: google.protobuf.Empty abort = 6;
         */
        abort: Empty;
    } | {
        oneofKind: undefined;
    };
}
/**
 * @generated from protobuf message ClientMessage.Call
 */
export interface ClientMessage_Call {
    /**
     * @generated from protobuf field: string method = 1;
     */
    method: string;
    /**
     * @generated from protobuf field: bytes request = 2;
     */
    request: Uint8Array;
    /**
     * @generated from protobuf field: optional google.protobuf.Timestamp deadline = 3;
     */
    deadline?: Timestamp;
}
/**
 * @generated from protobuf message ClientMessage.CallClientStream
 */
export interface ClientMessage_CallClientStream {
    /**
     * @generated from protobuf field: string method = 1;
     */
    method: string;
    /**
     * @generated from protobuf field: optional google.protobuf.Timestamp deadline = 2;
     */
    deadline?: Timestamp;
}
/**
 * @generated from protobuf message ServerMessage
 */
export interface ServerMessage {
    /**
     * @generated from protobuf field: uint64 id = 1;
     */
    id: number;
    /**
     * @generated from protobuf oneof: message
     */
    message: {
        oneofKind: "error";
        /**
         * @generated from protobuf field: ServerMessage.Error error = 2;
         */
        error: ServerMessage_Error;
    } | {
        oneofKind: "callResponse";
        /**
         * @generated from protobuf field: bytes callResponse = 3;
         */
        callResponse: Uint8Array;
    } | {
        oneofKind: "streamRecv";
        /**
         * @generated from protobuf field: bytes streamRecv = 4;
         */
        streamRecv: Uint8Array;
    } | {
        oneofKind: "streamClosed";
        /**
         * @generated from protobuf field: google.protobuf.Empty streamClosed = 5;
         */
        streamClosed: Empty;
    } | {
        oneofKind: undefined;
    };
}
/**
 * @generated from protobuf message ServerMessage.Error
 */
export interface ServerMessage_Error {
    /**
     * @generated from protobuf field: ErrorCode code = 1;
     */
    code: ErrorCode;
    /**
     * @generated from protobuf field: optional string message = 2;
     */
    message?: string;
    /**
     * @generated from protobuf field: optional uint32 userErrorCode = 3;
     */
    userErrorCode?: number;
}
/**
 * @generated from protobuf enum AuthMode
 */
export declare enum AuthMode {
    /**
     * @generated from protobuf enum value: AUTH_GUEST = 0;
     */
    AUTH_GUEST = 0,
    /**
     * @generated from protobuf enum value: AUTH_TOKEN = 1;
     */
    AUTH_TOKEN = 1,
    /**
     * @generated from protobuf enum value: AUTH_PUBKEY = 2;
     */
    AUTH_PUBKEY = 2
}
/**
 * @generated from protobuf enum AuthErrorCode
 */
export declare enum AuthErrorCode {
    /**
     * @generated from protobuf enum value: AUTHERR_INTERNAL = 0;
     */
    AUTHERR_INTERNAL = 0,
    /**
     * @generated from protobuf enum value: AUTHERR_BAD_MODE = 1;
     */
    AUTHERR_BAD_MODE = 1,
    /**
     * @generated from protobuf enum value: AUTHERR_BAD_CREDENTIAL = 2;
     */
    AUTHERR_BAD_CREDENTIAL = 2,
    /**
     * @generated from protobuf enum value: AUTHERR_RATE_LIMITED = 3;
     */
    AUTHERR_RATE_LIMITED = 3,
    /**
     * @generated from protobuf enum value: AUTHERR_USER_BANNED = 4;
     */
    AUTHERR_USER_BANNED = 4
}
/**
 * @generated from protobuf enum ErrorCode
 */
export declare enum ErrorCode {
    /**
     * @generated from protobuf enum value: ERR_INTERNAL = 0;
     */
    ERR_INTERNAL = 0,
    /**
     * @generated from protobuf enum value: ERR_BAD_ID = 1;
     */
    ERR_BAD_ID = 1,
    /**
     * @generated from protobuf enum value: ERR_BAD_METHOD = 2;
     */
    ERR_BAD_METHOD = 2,
    /**
     * @generated from protobuf enum value: ERR_BAD_INPUT = 3;
     */
    ERR_BAD_INPUT = 3,
    /**
     * @generated from protobuf enum value: ERR_BAD_STREAM_SEND = 4;
     */
    ERR_BAD_STREAM_SEND = 4,
    /**
     * @generated from protobuf enum value: ERR_STREAM_CLOSED = 5;
     */
    ERR_STREAM_CLOSED = 5,
    /**
     * @generated from protobuf enum value: ERR_RATE_LIMITED = 6;
     */
    ERR_RATE_LIMITED = 6,
    /**
     * @generated from protobuf enum value: ERR_NOT_AUTHORIZED = 7;
     */
    ERR_NOT_AUTHORIZED = 7,
    /**
     * @generated from protobuf enum value: ERR_USER = 8;
     */
    ERR_USER = 8
}
declare class ServerWelcome$Type extends MessageType<ServerWelcome> {
    constructor();
    create(value?: PartialMessage<ServerWelcome>): ServerWelcome;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ServerWelcome): ServerWelcome;
    internalBinaryWrite(message: ServerWelcome, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ServerWelcome
 */
export declare const ServerWelcome: ServerWelcome$Type;
declare class ClientAuthRequest$Type extends MessageType<ClientAuthRequest> {
    constructor();
    create(value?: PartialMessage<ClientAuthRequest>): ClientAuthRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ClientAuthRequest): ClientAuthRequest;
    internalBinaryWrite(message: ClientAuthRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ClientAuthRequest
 */
export declare const ClientAuthRequest: ClientAuthRequest$Type;
declare class ClientAuthRequest_Pubkey$Type extends MessageType<ClientAuthRequest_Pubkey> {
    constructor();
    create(value?: PartialMessage<ClientAuthRequest_Pubkey>): ClientAuthRequest_Pubkey;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ClientAuthRequest_Pubkey): ClientAuthRequest_Pubkey;
    internalBinaryWrite(message: ClientAuthRequest_Pubkey, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ClientAuthRequest.Pubkey
 */
export declare const ClientAuthRequest_Pubkey: ClientAuthRequest_Pubkey$Type;
declare class ServerAuthResponse$Type extends MessageType<ServerAuthResponse> {
    constructor();
    create(value?: PartialMessage<ServerAuthResponse>): ServerAuthResponse;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ServerAuthResponse): ServerAuthResponse;
    internalBinaryWrite(message: ServerAuthResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ServerAuthResponse
 */
export declare const ServerAuthResponse: ServerAuthResponse$Type;
declare class ClientPubkeyChallengeResponse$Type extends MessageType<ClientPubkeyChallengeResponse> {
    constructor();
    create(value?: PartialMessage<ClientPubkeyChallengeResponse>): ClientPubkeyChallengeResponse;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ClientPubkeyChallengeResponse): ClientPubkeyChallengeResponse;
    internalBinaryWrite(message: ClientPubkeyChallengeResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ClientPubkeyChallengeResponse
 */
export declare const ClientPubkeyChallengeResponse: ClientPubkeyChallengeResponse$Type;
declare class ClientMessage$Type extends MessageType<ClientMessage> {
    constructor();
    create(value?: PartialMessage<ClientMessage>): ClientMessage;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ClientMessage): ClientMessage;
    internalBinaryWrite(message: ClientMessage, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ClientMessage
 */
export declare const ClientMessage: ClientMessage$Type;
declare class ClientMessage_Call$Type extends MessageType<ClientMessage_Call> {
    constructor();
    create(value?: PartialMessage<ClientMessage_Call>): ClientMessage_Call;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ClientMessage_Call): ClientMessage_Call;
    internalBinaryWrite(message: ClientMessage_Call, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ClientMessage.Call
 */
export declare const ClientMessage_Call: ClientMessage_Call$Type;
declare class ClientMessage_CallClientStream$Type extends MessageType<ClientMessage_CallClientStream> {
    constructor();
    create(value?: PartialMessage<ClientMessage_CallClientStream>): ClientMessage_CallClientStream;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ClientMessage_CallClientStream): ClientMessage_CallClientStream;
    internalBinaryWrite(message: ClientMessage_CallClientStream, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ClientMessage.CallClientStream
 */
export declare const ClientMessage_CallClientStream: ClientMessage_CallClientStream$Type;
declare class ServerMessage$Type extends MessageType<ServerMessage> {
    constructor();
    create(value?: PartialMessage<ServerMessage>): ServerMessage;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ServerMessage): ServerMessage;
    internalBinaryWrite(message: ServerMessage, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ServerMessage
 */
export declare const ServerMessage: ServerMessage$Type;
declare class ServerMessage_Error$Type extends MessageType<ServerMessage_Error> {
    constructor();
    create(value?: PartialMessage<ServerMessage_Error>): ServerMessage_Error;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ServerMessage_Error): ServerMessage_Error;
    internalBinaryWrite(message: ServerMessage_Error, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ServerMessage.Error
 */
export declare const ServerMessage_Error: ServerMessage_Error$Type;
export {};

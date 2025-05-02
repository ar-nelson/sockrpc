import { MethodInfo, ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { BinaryReadOptions, BinaryWriteOptions } from "@protobuf-ts/runtime";
import * as pb from "./pb/sockrpc.ts";
import { WebSocketAdapter } from "./common.ts";
export interface SockRpcServerContext {
    method: MethodInfo<any, any>;
    user: string;
    deadline?: Date;
    abort: AbortSignal;
}
type PubkeyChallengeValidator = (opts: {
    challenge: Uint8Array;
    signature: Uint8Array;
}) => Promise<string | null>;
type PubkeyValidator = (request: pb.ClientAuthRequest_Pubkey) => Promise<PubkeyChallengeValidator | null>;
export interface ServerOptions {
    service: ServiceInfo;
    version?: string;
    handlers: any;
    auth: {
        userId: string;
    } | {
        guest?: () => Promise<string>;
        token?: (token: Uint8Array) => Promise<string | null>;
        pubkey?: PubkeyValidator;
    };
    binaryOptions?: Partial<BinaryReadOptions & BinaryWriteOptions>;
}
export declare function registerSockRpcServer(socket: WebSocketAdapter, options: ServerOptions): void;
export declare function ed25519Validator(pubkeyToUser: (request: pb.ClientAuthRequest_Pubkey) => Promise<string | null>): PubkeyValidator;
export {};

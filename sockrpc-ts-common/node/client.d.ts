import { RpcTransport, ServiceInfo } from "@protobuf-ts/runtime-rpc";
import * as pb from "./pb/sockrpc.ts";
import { WebSocketAdapter } from "./common.ts";
type SignFunction = (challenge: Uint8Array) => Promise<Uint8Array>;
export type Auth = {
    readonly auth: "guest";
} | {
    readonly auth: "token";
    readonly token: Uint8Array;
} | {
    readonly auth: "pubkey";
    readonly userId: string;
    readonly pubkey: Uint8Array;
    readonly sign: SignFunction;
};
type AuthFailures = {
    method: Auth;
    error: pb.AuthErrorCode;
}[];
export interface ConnectOptions {
    readonly service: ServiceInfo;
    readonly auth: readonly Auth[];
    readonly onAuthFailure?: (failures: AuthFailures) => void;
}
export declare function connectSockRpc(socket: WebSocketAdapter, options: ConnectOptions): Promise<RpcTransport>;
export declare function ed25519Signer(privateKey: CryptoKey): SignFunction;
export {};

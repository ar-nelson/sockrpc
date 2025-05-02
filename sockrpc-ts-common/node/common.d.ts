export interface WebSocketAdapter {
    send(data: Uint8Array): Promise<void>;
    close(code?: number, reason?: string): void;
    onMessage(handler: (data: Uint8Array) => void): void;
    onClose(handler: () => void): void;
}
export declare class BrowserWebSocketAdapter implements WebSocketAdapter {
    private socket;
    constructor(socket: WebSocket);
    send(data: Uint8Array): Promise<void>;
    close(code?: number, reason?: string): void;
    onMessage(handler: (data: Uint8Array) => void): void;
    onClose(handler: () => void): void;
}

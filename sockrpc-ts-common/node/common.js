export class BrowserWebSocketAdapter {
    socket;
    constructor(socket) {
        this.socket = socket;
        socket.binaryType = "arraybuffer";
    }
    send(data) {
        this.socket.send(data);
        return Promise.resolve();
    }
    close(code, reason) {
        this.socket.close(code, reason);
    }
    onMessage(handler) {
        this.socket.addEventListener("message", ({ data }) => handler(new Uint8Array(data)));
    }
    onClose(handler) {
        this.socket.addEventListener("close", () => handler());
        this.socket.addEventListener("error", () => handler());
    }
}
//# sourceMappingURL=common.js.map
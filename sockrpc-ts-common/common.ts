export interface WebSocketAdapter {
  send(data: Uint8Array): Promise<void>
  close(code?: number, reason?: string): void
  onMessage(handler: (data: Uint8Array) => void): void
  onClose(handler: () => void): void
}

export class BrowserWebSocketAdapter implements WebSocketAdapter {
  constructor(private socket: WebSocket) {
    socket.binaryType = "arraybuffer"
  }

  send(data: Uint8Array): Promise<void> {
    this.socket.send(data)
    return Promise.resolve()
  }

  close(code?: number, reason?: string): void {
    this.socket.close(code, reason)
  }

  onMessage(handler: (data: Uint8Array) => void): void {
    this.socket.addEventListener("message", ({ data }) =>
      handler(new Uint8Array(data))
    )
  }

  onClose(handler: () => void): void {
    this.socket.addEventListener("close", () => handler())
    this.socket.addEventListener("error", () => handler())
  }
}

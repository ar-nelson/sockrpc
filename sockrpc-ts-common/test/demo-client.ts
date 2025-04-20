import { ExampleService } from "./pb/exampleService.ts"
import { ExampleServiceClient } from "./pb/exampleService.client.ts"
import { BrowserWebSocketAdapter, connectSockRpc } from "../mod.ts"

export async function createClient(
  url = "ws://localhost:42069"
): Promise<ExampleServiceClient> {
  const ws = new WebSocket(url)
  ws.binaryType = "arraybuffer"
  return new ExampleServiceClient(
    await connectSockRpc(new BrowserWebSocketAdapter(ws), {
      service: ExampleService,
      auth: [{ auth: "guest" }],
    })
  )
}

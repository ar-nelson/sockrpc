import { Number$, ExampleService } from "./pb/exampleService.ts"
import { IExampleService } from "./pb/exampleService.server.ts"
import {
  BrowserWebSocketAdapter,
  registerSockRpcServer,
  SockRpcServerContext,
} from "../mod.ts"
import { RpcInputStream, RpcOutputStream } from "@protobuf-ts/runtime-rpc"
import { encodeHex } from "jsr:@std/encoding/hex"

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}

const exampleServiceHandlers: IExampleService<SockRpcServerContext> = {
  async foo({ n }: Number$, context: SockRpcServerContext): Promise<Number$> {
    console.log(`Received foo:${n} from user ${context.user}`)
    await sleep(100)
    return { n: n + 1 }
  },
  async bar(
    requests: RpcOutputStream<Number$>,
    context: SockRpcServerContext
  ): Promise<Number$> {
    console.log(`Opened client stream bar from user ${context.user}`)
    let count = 0
    for await (const { n } of requests) {
      console.log(`Client stream bar from user ${context.user} received ${n}`)
      count += n
    }
    console.log(
      `Closed client stream bar from user ${context.user}; received total of ${count}`
    )
    return { n: count }
  },
  async baz(
    { n }: Number$,
    responses: RpcInputStream<Number$>,
    context: SockRpcServerContext
  ): Promise<void> {
    console.log(`Received baz:${n} from user ${context.user}`)
    for (let i = n; i > 0; i--) {
      console.log(`Sending ${i} on server stream baz to user ${context.user}`)
      await responses.send({ n: i })
      await sleep(100)
    }
    console.log(`Done with server stream baz to user ${context.user}`)
  },
  async qux(
    requests: RpcOutputStream<Number$>,
    responses: RpcInputStream<Number$>,
    context: SockRpcServerContext
  ): Promise<void> {
    console.log(`Opened duplex stream qux from user ${context.user}`)
    let count = 0
    for await (const { n } of requests) {
      count += n
      console.log(
        `Duplex stream qux from user ${context.user} received ${n}; sending ${count}`
      )
      await responses.send({ n: count })
    }
    console.log(
      `Closed duplex stream bar from user ${context.user}; received total of ${count}`
    )
  },
}

Deno.serve({ port: 42069, hostname: "127.0.0.1" }, (req) => {
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, { status: 501 })
  }

  const { socket, response } = Deno.upgradeWebSocket(req)

  socket.addEventListener("open", () => {
    console.log("Received WebSocket connection")
    registerSockRpcServer(new BrowserWebSocketAdapter(socket), {
      service: ExampleService,
      handlers: exampleServiceHandlers,
      auth: {
        guest() {
          console.log("logged in as guest")
          return Promise.resolve("g")
        },
        token(token: Uint8Array) {
          console.log(`received token ${encodeHex(token)}`)
          return Promise.resolve("t")
        },
      },
    })
  })

  return response
})

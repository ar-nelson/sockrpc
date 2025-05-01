import { assertEquals } from "jsr:@std/assert";
import { ExampleService, Number$ } from "./pb/exampleService.ts";
import { ExampleServiceClient } from "./pb/exampleService.client.ts";
import { BrowserWebSocketAdapter, connectSockRpc } from "../mod.ts";
import { SockRpcServerContext } from "../server.ts";
import { registerSockRpcServer } from "../mod.ts";
import { RpcInputStream, RpcOutputStream } from "@protobuf-ts/runtime-rpc";
import { IExampleService } from "./pb/exampleService.server.ts";

// Test server implementation
const exampleServiceHandlers: IExampleService<SockRpcServerContext> = {
  async foo({ n }: Number$): Promise<Number$> {
    return { n: n + 1 };
  },
  async bar(requests: RpcOutputStream<Number$>): Promise<Number$> {
    let count = 0;
    for await (const { n } of requests) {
      count += n;
    }
    return { n: count };
  },
  async baz(
    { n }: Number$,
    responses: RpcInputStream<Number$>,
  ): Promise<void> {
    for (let i = n; i > 0; i--) {
      await responses.send({ n: i });
    }
  },
  async qux(
    requests: RpcOutputStream<Number$>,
    responses: RpcInputStream<Number$>,
  ): Promise<void> {
    let count = 0;
    for await (const { n } of requests) {
      count += n;
      await responses.send({ n: count });
    }
  },
};

// Helper function to create a test client
async function createClient(
  url = "ws://localhost:42069",
): Promise<{ client: ExampleServiceClient; ws: WebSocket }> {
  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";
  const client = new ExampleServiceClient(
    await connectSockRpc(new BrowserWebSocketAdapter(ws), {
      service: ExampleService,
      auth: [{ auth: "guest" }],
    }),
  );
  return { client, ws };
}

// Helper function to create a test server
function createServer(port: number) {
  const server = Deno.serve({ port, hostname: "127.0.0.1" }, (req) => {
    if (req.headers.get("upgrade") != "websocket") {
      return new Response(null, { status: 501 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.addEventListener("open", () => {
      registerSockRpcServer(new BrowserWebSocketAdapter(socket), {
        service: ExampleService,
        handlers: exampleServiceHandlers,
        auth: {
          guest() {
            return Promise.resolve("test-user");
          },
        },
      });
    });

    return response;
  });

  return server;
}

Deno.test("WebSocket RPC Tests", async (t) => {
  // Start test server
  const server = createServer(42069);
  const { client, ws } = await createClient();

  await t.step("Unary RPC (Foo)", async () => {
    const response = await client.foo({ n: 42 }).response;
    assertEquals(response.n, 43);
  });

  await t.step("Client Streaming RPC (Bar)", async () => {
    const call = client.bar();
    await call.requests.send({ n: 1 });
    await call.requests.send({ n: 2 });
    await call.requests.send({ n: 3 });
    await call.requests.complete();
    const response = await call.response;
    assertEquals(response.n, 6);
  });

  await t.step("Server Streaming RPC (Baz)", async () => {
    const call = client.baz({ n: 3 });
    const numbers: number[] = [];
    for await (const { n } of call.responses) {
      numbers.push(n);
    }
    assertEquals(numbers, [3, 2, 1]);
  });

  await t.step("Duplex Streaming RPC (Qux)", async () => {
    const call = client.qux();
    const numbers: number[] = [];

    // Start receiving responses
    const receivePromise = (async () => {
      for await (const { n } of call.responses) {
        numbers.push(n);
      }
    })();

    // Send requests
    await call.requests.send({ n: 1 });
    await call.requests.send({ n: 2 });
    await call.requests.send({ n: 3 });
    await call.requests.complete();

    // Wait for all responses
    await receivePromise;
    assertEquals(numbers, [1, 3, 6]);
  });

  // Cleanup
  ws.close();
  server.shutdown();
});

import { build, emptyDir } from "@deno/dnt"

await emptyDir("./npm")

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {},
  package: {
    name: "sockrpc-common",
    version: Deno.args[0],
    description:
      "Generic server and client support for SockRPC, based on protobuf-ts",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/ar-nelson/sockrpc.git",
    },
    bugs: {
      url: "https://github.com/username/ar-nelson/sockrpc",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE")
    Deno.copyFileSync("README.md", "npm/README.md")
  },
})

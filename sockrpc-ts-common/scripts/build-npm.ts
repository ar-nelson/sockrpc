#!/usr/bin/env -S deno run -A
import { rollup } from "rollup"
import typescript from "@rollup/plugin-typescript"

await Deno.mkdir("./node", { recursive: true })

const bundle = await rollup({
  input: "mod.ts",
  output: {
    dir: "./node",
  },
  plugins: [typescript()],
})

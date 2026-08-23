import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "cli/index": "src/cli/index.ts",
    "ops/index": "src/ops/index.ts",
    "mcp/index": "src/mcp/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  platform: "node",
  target: "node20",
  sourcemap: true,
  unbundle: false,
});

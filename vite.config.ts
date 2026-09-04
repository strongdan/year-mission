import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";
import path from "node:path";

const dirname = import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  plugins: [
    vinext({
      cache: { cdn: cdnAdapter() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  resolve: {
    alias: {
      "sharp": path.resolve(dirname, "empty-stub.js"),
    },
  },
});

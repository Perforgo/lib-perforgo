import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    target: "es2015",
    lib: {
      entry: [resolve(__dirname, "lib/perforgo.js")],
      name: "Perforgo",
      formats: ["umd", "es"],
    },
    minify: true,
    rollupOptions: {
      external: ["web-vitals", "uid", "@nuxt/kit"],
      output: {
        globals: {
          "web-vitals": "webVitals",
          uid: "uid",
        },
      },
    },
  },
  plugins: [dts()],
});

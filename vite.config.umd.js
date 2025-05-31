import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: [resolve(__dirname, "lib/perforgo.umd.js")],
      name: "Perforgo",
      formats: ["umd"],
      fileName: () => "perforgo.umd.js",
    },
    rollupOptions: {
      external: ["@nuxt/kit"],
      output: {
        exports: "default",
        globals: {
          "web-vitals": "webVitals",
          uid: "uid",
        },
      },
    },
    minify: true,
    outDir: "dist/cdn",
    emptyOutDir: false,
  },
});

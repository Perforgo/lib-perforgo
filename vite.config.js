import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import fs from "fs";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: [resolve(__dirname, "lib/perforgo.js")],
      name: "Perforgo",
      formats: ["umd", "es"],
      fileName: (format) => `perforgo.${format}.js`,
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
  plugins: [
    dts(),
    {
      name: "copy-umd-to-cjs",
      closeBundle() {
        const src = path.resolve(__dirname, "dist/perforgo.umd.js");
        const dest = path.resolve(__dirname, "dist/perforgo.umd.cjs");
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log("✅ Copied UMD to perforgo.umd.cjs");
        }
      },
    },
  ],
});

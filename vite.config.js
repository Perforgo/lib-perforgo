import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	build: {
		lib: {
			entry: [resolve(__dirname, "lib/core.js")],
			name: "Perforgo",
		},
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

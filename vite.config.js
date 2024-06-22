import { resolve } from "path";
import { defineConfig } from "vite";

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
});

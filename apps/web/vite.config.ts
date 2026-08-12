import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: { "@": path.resolve(import.meta.dirname, "src") },
	},
	envDir: "../../",
	test: {
		environment: "jsdom",
		setupFiles: "./src/test/setup.ts",
		env: { VITE_API_URL: "http://localhost:3000" },
	},
});

import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/server.ts"],
	format: ["esm"],
	// JIT: @ews/shared는 소스 그대로 api 번들에 포함 (ADR 0006)
	noExternal: ["@ews/shared"],
	clean: true,
	sourcemap: true,
});

import { defineConfig } from "drizzle-kit";

process.loadEnvFile("../../.env");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

export default defineConfig({
	out: "./drizzle",
	dialect: "postgresql",
	schema: "./src/features/**/*.schema.ts",
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
});

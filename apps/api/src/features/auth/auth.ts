import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export const createAuth = (db: NodePgDatabase<Record<string, unknown>>) =>
	betterAuth({
		database: drizzleAdapter(db, { provider: "pg" }),
	});

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as authSchema from "./auth.schema";

export const createAuth = (db: NodePgDatabase<Record<string, unknown>>) =>
	betterAuth({
		database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
		emailAndPassword: { enabled: true },
	});

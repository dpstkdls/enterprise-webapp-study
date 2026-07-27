import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as authSchema from "./auth.schema";

export const createAuth = (db: NodePgDatabase<Record<string, unknown>>) =>
	betterAuth({
		database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
		emailAndPassword: { enabled: true },
		// dev는 기본 비활성. sign-in/sign-up 등엔 내장 특수 규칙(10초/3회)이 적용된다.
		rateLimit: { enabled: true },
		plugins: [admin()],
	});

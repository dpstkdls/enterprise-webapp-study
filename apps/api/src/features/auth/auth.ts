import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { isAccountExpired } from "./auth.expiry";
import * as authSchema from "./auth.schema";

type DbUser = typeof authSchema.user.$inferSelect;

export const createAuth = (db: NodePgDatabase<Record<string, unknown>>) =>
	betterAuth({
		database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
		emailAndPassword: { enabled: true },
		// dev는 기본 비활성. sign-in/sign-up 등엔 내장 특수 규칙(10초/3회)이 적용된다.
		rateLimit: { enabled: true },
		plugins: [admin()],
		user: {
			additionalFields: {
				expiresAt: { type: "date", required: false, input: false },
			},
		},
		databaseHooks: {
			session: {
				create: {
					before: async (session, ctx) => {
						const user = (await ctx?.context.internalAdapter.findUserById(
							session.userId,
						)) as DbUser | undefined;
						if (isAccountExpired(user?.expiresAt, new Date())) {
							throw new APIError("FORBIDDEN", {
								message: "Account expired",
								code: "ACCOUNT_EXPIRED",
							});
						}
					},
				},
			},
		},
	});

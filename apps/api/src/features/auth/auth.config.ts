// cli 전용 앱코드는 아래 내용 impport 하지 않는다.
import { drizzle } from "drizzle-orm/node-postgres";
import { createAuth } from "./auth";

process.loadEnvFile("../../.env");

export const auth = createAuth(
	drizzle(process.env.DATABASE_URL as string, { casing: "snake_case" }),
);

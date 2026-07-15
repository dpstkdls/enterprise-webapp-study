import { env } from "@ews/shared";

console.log(
	" env OK: ",
	env.DATABASE_URL.replace(/:[^:@]+@/, ":***@"),
	env.REDIS_URL,
);

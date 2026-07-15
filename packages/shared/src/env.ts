import { z } from "zod";

const EnvSchema = z.object({
	DATABASE_URL: z.url(),
	REDIS_URL: z.url(),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
	console.error("❌ 환경변수 검증 실패");
	console.error(z.prettifyError(result.error));
	process.exit(1);
}

export const env = result.data;

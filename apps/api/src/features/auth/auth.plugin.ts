import fp from "fastify-plugin";
import { createAuth } from "./auth";

export default fp(async (fastify) => {
	fastify.decorate("auth", createAuth(fastify.db, fastify.config.WEB_ORIGIN));
});

declare module "fastify" {
	interface FastifyInstance {
		auth: ReturnType<typeof createAuth>;
	}
}

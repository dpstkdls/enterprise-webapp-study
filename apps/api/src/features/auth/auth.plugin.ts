import fp from "fastify-plugin";
import { createAuth } from "./auth";

export default fp(async (fastify) => {
	fastify.decorate("auth", createAuth(fastify.db));
});

declare module "fastify" {
	interface FastifyInstance {
		auth: ReturnType<typeof createAuth>;
	}
}

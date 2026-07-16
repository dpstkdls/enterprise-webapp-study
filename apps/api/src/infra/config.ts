import { env } from "@ews/shared";
import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
	interface FastifyInstance {
		config: typeof env;
	}
}

const envPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
	fastify.decorate("config", env);

	done();
};

export default fp(envPlugin);

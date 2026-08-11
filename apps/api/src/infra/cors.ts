import cors from "@fastify/cors";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const corsPlugin: FastifyPluginAsync = async (fastify) => {
	await fastify.register(cors, {
		origin: [fastify.config.WEB_ORIGIN],
		credentials: true,
	});
};

export default fp(corsPlugin);

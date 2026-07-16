import type { FastifyPluginAsync } from "fastify";

export const healthRoute: FastifyPluginAsync = async (fastify, _options) => {
	fastify.get("/health", async (request, _reply) => {
		request.log.info("Health check endpoint called");
		return { status: "ok" };
	});
};

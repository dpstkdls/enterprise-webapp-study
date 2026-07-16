import type { FastifyPluginAsync } from "fastify";

export const healthRoute: FastifyPluginAsync = async (fastify, _options) => {
	fastify.get("/health", async (_request, _reply) => {
		return { status: "ok" };
	});
};

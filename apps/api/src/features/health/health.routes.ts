import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";

export const healthRoute: FastifyPluginAsyncZod = async (fastify, _options) => {
	fastify.get(
		"/health",
		{
			schema: {
				response: { 200: z.object({ status: z.literal("ok") }) },
			},
		},
		async (request, _reply) => {
			request.log.info("Health check endpoint called");
			return { status: "ok" as const };
		},
	);
};

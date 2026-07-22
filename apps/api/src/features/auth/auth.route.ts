import type { FastifyPluginAsync } from "fastify";
import { createAuth } from "./auth";

export const authRoute: FastifyPluginAsync = async (fastify) => {
	const auth = createAuth(fastify.db);
	fastify.route({
		method: ["GET", "POST"],
		url: "/api/auth/*",
		async handler(request, reply) {
			const url = new URL(request.url, `http://${request.headers.host}`);
			const headers = new Headers();

			for (const [key, value] of Object.entries(request.headers)) {
				if (value) headers.append(key, value.toString());
			}
			const req = new Request(url, {
				method: request.method,
				headers,
				body: request.body ? JSON.stringify(request.body) : undefined,
			});
			const response = await auth.handler(req);
			reply.status(response.status);
			response.headers.forEach((value, key) => {
				reply.header(key, value);
			});
			reply.send(response.body ? await response.text() : null);
		},
	});
};

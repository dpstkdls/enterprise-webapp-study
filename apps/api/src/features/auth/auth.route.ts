import type { FastifyPluginAsync } from "fastify";
import { createAuth } from "./auth";
import { requireAdmin } from "./auth.guards";
import { toWebHeaders } from "./auth.headers";

export const authRoute: FastifyPluginAsync = async (fastify) => {
	const auth = createAuth(fastify.db);
	fastify.route({
		method: ["GET", "POST"],
		url: "/api/auth/*",
		async handler(request, reply) {
			const url = new URL(request.url, `http://${request.headers.host}`);
			const headers = toWebHeaders(request);

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

	fastify.get(
		"/admin/users",
		{ preHandler: requireAdmin(auth) },
		async (request) => {
			const users = await auth.api.listUsers({
				query: {},
				headers: toWebHeaders(request),
			});
			return users;
		},
	);
};

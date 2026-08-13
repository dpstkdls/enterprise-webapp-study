import type { WebSocket } from "@fastify/websocket";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { requireOrg } from "../auth/auth.guards";
import { toWebHeaders } from "../auth/auth.headers";
import { getRecent, insertMetrics } from "./metrics.service";
import { subscribe } from "./metrics.stream";

const ingestBody = z.object({
	serverId: z.coerce.number(),
	cpu: z.number().min(0).max(100),
	memory: z.number().min(0).max(100),
});

const metricsResponse = z.object({
	id: z.number(),
	serverId: z.number(),
	cpu: z.number(),
	memory: z.number(),
	createdAt: z.iso.datetime(),
});

export const metricsRoute: FastifyPluginAsyncZod = async (
	fastify,
	_options,
) => {
	fastify.addHook("preHandler", requireOrg(fastify.auth));

	const db = fastify.db;

	fastify.get(
		"/metrics",
		{
			schema: {
				querystring: z.object({
					limit: z.coerce.number().int().min(1).max(500).default(50),
				}),
				response: { 200: z.array(metricsResponse) },
			},
		},
		async (request, _reply) => {
			return getRecent(db, request.orgId, request.query.limit);
		},
	);
	fastify.post(
		"/metrics",
		{
			schema: {
				body: ingestBody,
				response: { 201: metricsResponse },
			},
		},
		async (request, reply) => {
			const created = await insertMetrics(db, request.orgId, request.body);
			return reply.code(201).send(created);
		},
	);
	fastify.get(
		"/metrics/stream",
		{ websocket: true },
		(socket: WebSocket, request) => {
			subscribe(request.orgId, socket);

			const interval = setInterval(async () => {
				const session = await fastify.auth.api.getSession({
					headers: toWebHeaders(request),
				});
				if (!session) socket.close(4001, "session expired");
			}, 60_000);
			socket.on("close", () => clearInterval(interval));
		},
	);
};

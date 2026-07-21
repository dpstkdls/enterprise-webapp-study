import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import {
	createServer,
	getServer,
	getServers,
	removeServer,
	updateServer,
} from "./servers.service";

const idParams = z.object({ id: z.coerce.number() });
const createBody = z.object({
	hostname: z.string(),
	ip: z.string(),
	status: z.number().int().min(0).max(1),
});

const updateBody = z
	.object({
		hostname: z.string().optional(),
		ip: z.string().optional(),
		status: z.number().int().min(0).max(1).optional(),
	})
	.refine((d) => Object.values(d).some((v) => v !== undefined), {
		message: "At least one field must be provided",
	});

const serverResponse = z.object({
	id: z.number(),
	hostname: z.string(),
	ip: z.string(),
	status: z.number().int().min(0).max(1),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const serversRoute: FastifyPluginAsyncZod = async (
	fastify,
	_options,
) => {
	const db = fastify.db;

	fastify.get(
		"/servers",
		{
			schema: {
				response: { 200: z.array(serverResponse) },
			},
		},
		async (request, _reply) => {
			request.log.info("Get servers endpoint called");
			return getServers(db);
		},
	);
	fastify.get(
		"/servers/:id",
		{
			schema: {
				params: idParams,
				response: { 200: serverResponse },
			},
		},
		async (request, _reply) => {
			request.log.info("Get server endpoint called");
			return getServer(db, request.params.id);
		},
	);
	fastify.post(
		"/servers",
		{
			schema: {
				body: createBody,
				response: { 200: serverResponse },
			},
		},
		async (request, _reply) => {
			request.log.info("Create server endpoint called");
			return createServer(db, request.body);
		},
	);
	fastify.patch(
		"/servers/:id",
		{
			schema: {
				params: idParams,
				body: updateBody,
				response: { 200: serverResponse },
			},
		},
		async (request, _reply) => {
			request.log.info("Update server endpoint called");
			return updateServer(db, request.params.id, request.body);
		},
	);
	fastify.delete(
		"/servers/:id",
		{
			schema: {
				params: idParams,
				response: { 200: serverResponse },
			},
		},
		async (request, _reply) => {
			request.log.info("Delete server endpoint called");
			return removeServer(db, request.params.id);
		},
	);
};

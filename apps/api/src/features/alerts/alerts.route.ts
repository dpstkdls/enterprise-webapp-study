import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { requireOrg } from "../auth/auth.guards";
import {
	createAlertRule,
	getAlertRules,
	removeAlertRule,
	updateAlertRule,
} from "./alerts.service";

const idParams = z.object({ id: z.coerce.number() });
const createBody = z.object({
	serverId: z.number(),
	metric: z.enum(["cpu", "memory"]),
	threshold: z.number().min(0).max(100),
	enabled: z.boolean(),
});

const updateBody = z
	.object({
		metric: z.enum(["cpu", "memory"]).optional(),
		threshold: z.number().min(0).max(100).optional(),
		enabled: z.boolean().optional(),
	})
	.refine((d) => Object.values(d).some((v) => v !== undefined), {
		message: "At least one field must be provided",
	});

const alertResponse = z.object({
	id: z.number(),
	serverId: z.number(),
	metric: z.enum(["cpu", "memory"]),
	threshold: z.number().min(0).max(100),
	enabled: z.boolean(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const alertsRoute: FastifyPluginAsyncZod = async (fastify, _options) => {
	fastify.addHook("preHandler", requireOrg(fastify.auth));

	const db = fastify.db;

	fastify.get(
		"/alert-rules",
		{
			schema: {
				response: { 200: z.array(alertResponse) },
			},
		},
		async (request, _reply) => {
			request.log.info("Get alert rules endpoint called");
			return getAlertRules(db, request.orgId);
		},
	);
	fastify.post(
		"/alert-rules",
		{
			schema: {
				body: createBody,
				response: { 200: alertResponse },
			},
		},
		async (request, _reply) => {
			request.log.info("Create alert rule endpoint called");
			return createAlertRule(db, request.orgId, request.body);
		},
	);
	fastify.patch(
		"/alert-rules/:id",
		{
			schema: {
				params: idParams,
				body: updateBody,
				response: { 200: alertResponse },
			},
		},
		async (request, _reply) => {
			request.log.info("Update alert rule endpoint called");
			return updateAlertRule(
				db,
				request.orgId,
				request.params.id,
				request.body,
			);
		},
	);
	fastify.delete(
		"/alert-rules/:id",
		{
			schema: {
				params: idParams,
				response: { 200: alertResponse },
			},
		},
		async (request, _reply) => {
			request.log.info("Delete alert rule endpoint called");
			return removeAlertRule(db, request.orgId, request.params.id);
		},
	);
};

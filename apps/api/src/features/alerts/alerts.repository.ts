import { and, eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { servers } from "../servers/servers.schema";
import { type AlertMetric, alertRules } from "./alerts.schema";

export const list = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
) => {
	const result = await db
		.select({
			id: alertRules.id,
			serverId: alertRules.serverId,
			metric: alertRules.metric,
			threshold: alertRules.threshold,
			enabled: alertRules.enabled,
			createdAt: alertRules.createdAt,
			updatedAt: alertRules.updatedAt,
		})
		.from(alertRules)
		.innerJoin(servers, eq(alertRules.serverId, servers.id))
		.where(eq(servers.organizationId, orgId));
	return result;
};

export const create = async (
	db: NodePgDatabase<Record<string, unknown>>,
	data: {
		serverId: number;
		metric: AlertMetric;
		threshold: number;
		enabled: boolean;
	},
) => {
	const result = await db
		.insert(alertRules)
		.values({
			metric: data.metric,
			threshold: data.threshold,
			enabled: data.enabled,
			serverId: data.serverId,
		})
		.returning();

	return result;
};

export const update = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	id: number,
	data: { metric?: AlertMetric; threshold?: number; enabled?: boolean },
) => {
	const result = await db
		.update(alertRules)
		.set({
			metric: data.metric,
			threshold: data.threshold,
			enabled: data.enabled,
		})
		.from(servers)
		.where(
			and(
				eq(alertRules.serverId, servers.id),
				eq(servers.organizationId, orgId),
				eq(alertRules.id, id),
			),
		)
		.returning();

	return result;
};

export const remove = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	id: number,
) => {
	const result = await db
		.delete(alertRules)
		.where(
			and(
				eq(alertRules.id, id),
				inArray(
					alertRules.serverId,
					db
						.select({ id: servers.id })
						.from(servers)
						.where(eq(servers.organizationId, orgId)),
				),
			),
		)
		.returning();

	return result;
};

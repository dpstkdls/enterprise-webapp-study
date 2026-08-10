import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { servers } from "./servers.schema";

export const list = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
) => {
	const result = await db
		.select()
		.from(servers)
		.where(eq(servers.organizationId, orgId));
	return result;
};

export const getById = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	id: number,
) => {
	const result = await db
		.select()
		.from(servers)
		.where(and(eq(servers.organizationId, orgId), eq(servers.id, id)));
	return result[0];
};

export const create = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	data: { hostname: string; ip: string; status: number },
) => {
	const result = await db
		.insert(servers)
		.values({
			hostname: data.hostname,
			ip: data.ip,
			status: data.status,
			organizationId: orgId,
		})
		.returning();

	return result;
};

export const update = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	id: number,
	data: { hostname?: string; ip?: string; status?: number },
) => {
	const result = await db
		.update(servers)
		.set({
			hostname: data.hostname,
			ip: data.ip,
			status: data.status,
		})
		.where(and(eq(servers.organizationId, orgId), eq(servers.id, id)))
		.returning();

	return result;
};

export const remove = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	id: number,
) => {
	const result = await db
		.delete(servers)
		.where(and(eq(servers.organizationId, orgId), eq(servers.id, id)))
		.returning();

	return result;
};

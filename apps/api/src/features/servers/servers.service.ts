import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AppError } from "../../infra/errors";
import { create, getById, list, remove, update } from "./servers.repository";

const serialize = <T extends { createdAt: Date; updatedAt: Date }>(row: T) => ({
	...row,
	createdAt: row.createdAt.toISOString(),
	updatedAt: row.updatedAt.toISOString(),
});

export const getServers = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
) => {
	const serversList = await list(db, orgId);
	return serversList.map(serialize);
};

export const getServer = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	id: number,
) => {
	const server = await getById(db, orgId, id);
	if (!server) {
		throw new AppError(
			404,
			"SERVER_NOT_FOUND",
			`Server with id ${id} not found`,
		);
	}
	return serialize(server);
};

export const createServer = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	data: { hostname: string; ip: string; status: number },
) => {
	const [createdServer] = await create(db, orgId, data);
	if (!createdServer) {
		throw new AppError(
			500,
			"INSERT_FAILED",
			"Insert returned no rows", // 실제로는 도달 불가
		);
	}
	return serialize(createdServer);
};

export const updateServer = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	id: number,
	data: { hostname?: string; ip?: string; status?: number },
) => {
	const [modifiedServer] = await update(db, orgId, id, data);
	if (!modifiedServer) {
		throw new AppError(
			404,
			"SERVER_NOT_FOUND",
			`Server with id ${id} not found`,
		);
	}
	return serialize(modifiedServer);
};

export const removeServer = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	id: number,
) => {
	const [deletedServer] = await remove(db, orgId, id);
	if (!deletedServer) {
		throw new AppError(
			404,
			"SERVER_NOT_FOUND",
			`Server with id ${id} not found`,
		);
	}
	return serialize(deletedServer);
};

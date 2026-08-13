import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AppError } from "../../infra/errors";
import { getServer } from "../servers/servers.service";
import { findRecentByOrg, insertMetric } from "./metrics.repository";

const serialize = <T extends { createdAt: Date }>(row: T) => ({
	...row,
	createdAt: row.createdAt.toISOString(),
});

export const insertMetrics = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	data: { serverId: number; cpu: number; memory: number },
) => {
	await getServer(db, orgId, data.serverId); // org 소유 아니면 404
	const [createdMetric] = await insertMetric(db, data);
	if (!createdMetric) {
		throw new AppError(500, "INSERT_FAILED", "Insert returned no rows");
	}
	return serialize(createdMetric);
};

export const getRecent = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	limit: number,
) => {
	const recentMetrics = await findRecentByOrg(db, orgId, limit);
	return recentMetrics.map(serialize);
};

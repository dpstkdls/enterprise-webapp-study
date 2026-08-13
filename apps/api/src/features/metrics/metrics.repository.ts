import { desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { servers } from "../servers/servers.schema";
import { metrics } from "./metrics.schema";

type Db = NodePgDatabase<Record<string, unknown>>;

export const insertMetric = (
	db: Db,
	data: { serverId: number; cpu: number; memory: number },
) => {
	return db.insert(metrics).values(data).returning();
};

export const findRecentByOrg = (db: Db, orgId: string, limit: number) => {
	return db
		.select({
			id: metrics.id,
			serverId: metrics.serverId,
			cpu: metrics.cpu,
			memory: metrics.memory,
			createdAt: metrics.createdAt,
		})
		.from(metrics)
		.innerJoin(servers, eq(metrics.serverId, servers.id))
		.where(eq(servers.organizationId, orgId))
		.orderBy(desc(metrics.createdAt))
		.limit(limit);
};

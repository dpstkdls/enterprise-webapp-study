import { and, avg, count, lt, max, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { metrics, metricsRollup } from "./metrics.schema";

type Db = NodePgDatabase<Record<string, unknown>>;

const MINUTE = 60_000;

export const rollupMetrics = async (db: Db, now: Date) => {
	// 직전 완결 버킷 경계
	const cutoff = new Date(
		Math.floor(now.getTime() / MINUTE) * MINUTE - 5 * MINUTE,
	);

	return db.transaction(async (tx) => {
		const bucket = sql`date_trunc('minute', ${metrics.createdAt})`.mapWith(
			(v: string) => new Date(v),
		);
		const aggregated = await tx
			.select({
				serverId: metrics.serverId,
				bucketStart: bucket,
				cpuAvg: avg(metrics.cpu).mapWith(Number),
				cpuMax: max(metrics.cpu).mapWith(Number),
				memoryAvg: avg(metrics.memory).mapWith(Number),
				memoryMax: max(metrics.memory).mapWith(Number),
				sampleCount: count().mapWith(Number),
			})
			.from(metrics)
			.where(lt(metrics.createdAt, cutoff))
			.groupBy(metrics.serverId, bucket);

		if (aggregated.length > 0) {
			await tx.insert(metricsRollup).values(aggregated).onConflictDoNothing(); // 멱등성 보장;
		}

		const deleted = await tx
			.delete(metrics)
			.where(and(lt(metrics.createdAt, cutoff)))
			.returning({ id: metrics.id });

		return { buckets: aggregated.length, deletedRows: deleted.length };
	});
};

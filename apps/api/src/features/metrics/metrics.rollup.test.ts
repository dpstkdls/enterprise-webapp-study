import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { organization } from "../auth/auth.schema";
import { servers } from "../servers/servers.schema";
import { rollupMetrics } from "./metrics.rollup";
import { metrics, metricsRollup } from "./metrics.schema";

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: NodePgDatabase<Record<string, unknown>>;
let serverId: number;

const first = <T>(rows: T[]): T => {
	const [head] = rows;
	if (!head) throw new Error("expected at least one row");
	return head;
};

beforeAll(async () => {
	container = await new PostgreSqlContainer("postgres:17-alpine").start();
	pool = new Pool({ connectionString: container.getConnectionUri() });
	db = drizzle(pool, { casing: "snake_case" });
	await migrate(db, { migrationsFolder: "./drizzle" });
}, 60_000);

beforeAll(async () => {
	await db.insert(organization).values({
		id: "org-123",
		name: "Test Org",
		slug: "test-org",
		createdAt: new Date(),
	});

	const result = await db
		.insert(servers)
		.values({
			hostname: "test-server",
			ip: "192.168.10.50",
			status: 1,
			organizationId: "org-123",
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.returning();
	serverId = first(result).id;
}, 60_000);

afterAll(async () => {
	await pool?.end();
	await container?.stop();
});

const NOW = new Date("2026-08-13T12:00:00.000Z");
const OLD = new Date("2026-08-13T11:50:10.000Z");
const RECENT = new Date("2026-08-13T11:59:50.000Z");

describe("rollupMetrics", () => {
	it("오래된 원본을 1분 버킷으로 집계하고 삭제, 최근 것은 보존", async () => {
		await db.insert(metrics).values([
			{ serverId, cpu: 10, memory: 30, createdAt: OLD },
			{
				serverId,
				cpu: 30,
				memory: 50,
				createdAt: new Date(OLD.getTime() + 5_000),
			},
			{ serverId, cpu: 10, memory: 40, createdAt: RECENT },
		]);

		const result = await rollupMetrics(db, NOW);
		expect(result).toEqual({ buckets: 1, deletedRows: 2 });

		const rollups = await db.select().from(metricsRollup);
		expect(rollups).toHaveLength(1);
		expect(rollups[0]).toMatchObject({
			serverId,
			cpuAvg: 20,
			cpuMax: 30,
			memoryAvg: 40,
			memoryMax: 50,
			sampleCount: 2,
		});

		const remaining = await db.select().from(metrics);
		expect(remaining).toHaveLength(1);
	});

	it("재실행해도 결과가 같다 (같은 now 두 번)", async () => {
		const second = await rollupMetrics(db, NOW);
		expect(second).toEqual({ buckets: 0, deletedRows: 0 });
		expect(await db.select().from(metricsRollup)).toHaveLength(1);
	});

	it("집계 후 삭제 전에 죽은 재시도 시나리오 - 중복 없이 마무리된다.", async () => {
		// 원본 재주입 + rollup 행은 이미 존재하는 상태 = "insert까지 하고 죽음" 재현
		await db.insert(metrics).values([
			{ serverId, cpu: 10, memory: 30, createdAt: OLD },
			{
				serverId,
				cpu: 30,
				memory: 50,
				createdAt: new Date(OLD.getTime() + 5_000),
			},
		]);

		const retry = await rollupMetrics(db, NOW);

		expect(retry.deletedRows).toBe(2);
	});
});

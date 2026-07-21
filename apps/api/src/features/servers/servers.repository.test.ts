import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { create, getById, list, remove, update } from "./servers.repository";

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: NodePgDatabase<Record<string, unknown>>;

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

afterAll(async () => {
	await pool?.end();
	await container?.stop();
});

describe("서버 리스트 조회", () => {
	it("생성, 단건 조회", async () => {
		const created = first(
			await create(db, {
				hostname: "web-01",
				ip: "10.0.0.1",
				status: 1,
			}),
		);

		const found = await getById(db, created.id);

		expect(found).toMatchObject({
			hostname: "web-01",
			ip: "10.0.0.1",
			status: 1,
		});

		expect(found?.createdAt).toBeInstanceOf(Date);
	});

	it("만든 행이 조회됨", async () => {
		await create(db, {
			hostname: "web-02",
			ip: "10.0.0.2",
			status: 1,
		});
		const rows = await list(db);
		expect(rows.some((row) => row.hostname === "web-02")).toBe(true);
	});

	it("부분 update후 조회", async () => {
		const created = first(
			await create(db, {
				hostname: "web-03",
				ip: "10.0.0.3",
				status: 1,
			}),
		);
		await new Promise((r) => setTimeout(r, 10)); // updatedAt 밀리초 차이 보장

		const updated = first(await update(db, created.id, { status: 0 }));

		expect(updated).toMatchObject({
			hostname: "web-03",
			ip: "10.0.0.3",
			status: 0,
		});
		expect(updated.updatedAt.getTime()).toBeGreaterThan(
			created.updatedAt.getTime(),
		);
	});

	it("삭제 후 getById는 undefined 확인", async () => {
		const created = first(
			await create(db, {
				hostname: "web-04",
				ip: "10.0.0.4",
				status: 1,
			}),
		);
		const deleted = first(await remove(db, created.id));

		expect(deleted.id).toBe(created.id);
		expect(await getById(db, created.id)).toBeUndefined();
	});

	it("없는 id update/remove 시 빈 배열", async () => {
		expect(await update(db, 9999, { status: 0 })).toEqual([]);
		expect(await remove(db, 9999)).toEqual([]);
	});
});

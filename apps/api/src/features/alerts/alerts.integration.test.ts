import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { FastifyInstance, InjectOptions } from "fastify";
import { Pool } from "pg";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PASSWORD = "password123";
const ORIGIN = "http://localhost:80";

let container: StartedPostgreSqlContainer;
let redis: StartedTestContainer;
let pool: Pool;
let app: FastifyInstance;

beforeAll(async () => {
	container = await new PostgreSqlContainer("postgres:17-alpine").start();
	process.env.DATABASE_URL = container.getConnectionUri();
	// queuePlugin(BullMQ)이 ready 시점에 실접속 — 더미 URL이면 CI(redis 없음)에서 plugin timeout
	redis = await new GenericContainer("redis:8-alpine")
		.withExposedPorts(6379)
		.start();
	process.env.REDIS_URL = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;
	process.env.WEB_ORIGIN = "http://localhost:5173";

	pool = new Pool({ connectionString: container.getConnectionUri() });
	await migrate(drizzle(pool, { casing: "snake_case" }), {
		migrationsFolder: "./drizzle",
	});

	const { default: buildApp } = await import("../../app"); // env 세팅 후 import
	app = buildApp();
	await app.ready();
}, 60_000);

afterAll(async () => {
	await app?.close();
	await pool?.end();
	await container?.stop();
	await redis?.stop();
});

const cookieOf = (res: { cookies: { name: string; value: string }[] }) =>
	res.cookies.map((c) => `${c.name}=${c.value}`).join("; ");

const authedInject = (cookie: string, opts: InjectOptions) =>
	app.inject({
		...opts,
		headers: { Cookie: cookie, Origin: ORIGIN, ...opts.headers },
	});

const signUp = async (email: string, name: string) => {
	const res = await app.inject({
		url: "/api/auth/sign-up/email",
		method: "POST",
		body: { name, email, password: PASSWORD },
	});
	expect(res.statusCode).toBe(200);
};

const signIn = async (email: string) => {
	const res = await app.inject({
		url: "/api/auth/sign-in/email",
		method: "POST",
		body: { email, password: PASSWORD },
	});
	expect(res.statusCode).toBe(200);
	return cookieOf(res);
};

const createActiveOrg = async (cookie: string, name: string, slug: string) => {
	const created = await authedInject(cookie, {
		url: "/api/auth/organization/create",
		method: "POST",
		body: { name, slug },
	});
	expect(created.statusCode).toBe(200);

	const activated = await authedInject(cookie, {
		url: "/api/auth/organization/set-active",
		method: "POST",
		body: { organizationSlug: slug },
	});
	expect(activated.statusCode).toBe(200);
};

const createServer = async (
	cookie: string,
	hostname: string,
	ip: string,
	status: number,
) => {
	const res = await authedInject(cookie, {
		url: "/servers",
		method: "POST",
		body: { hostname, ip, status },
	});
	expect(res.statusCode).toBe(200);
	return res.json().id;
};

describe("metrics 통합", () => {
	let cookie: string;
	let serverId: number;
	let ruleId: number;

	beforeAll(async () => {
		await signUp("user-a@example.com", "User A");
		cookie = await signIn("user-a@example.com");
		await createActiveOrg(cookie, "Org A", "org-a");
		serverId = await createServer(cookie, "web-01", "10.0.0.1", 1);
	});

	it("추가 -> alert-rules 조회", async () => {
		const res = await authedInject(cookie, {
			url: "/alert-rules",
			method: "POST",
			body: { serverId, metric: "cpu", threshold: 53.5, enabled: true },
		});
		expect(res.statusCode).toBe(200);
		ruleId = res.json().id;

		const list = await authedInject(cookie, {
			url: "/alert-rules",
			method: "GET",
		});

		expect(list.statusCode).toBe(200);
		const rows = list.json();
		expect(rows[0]).toMatchObject({
			serverId,
			metric: "cpu",
			threshold: 53.5,
			enabled: true,
		});
	});

	it("수정 -> alert-rules 조회", async () => {
		const res = await authedInject(cookie, {
			url: `/alert-rules/${ruleId}`,
			method: "PATCH",
			body: { serverId, metric: "memory", threshold: 60, enabled: false },
		});
		expect(res.statusCode).toBe(200);

		const list = await authedInject(cookie, {
			url: "/alert-rules",
			method: "GET",
		});

		expect(list.statusCode).toBe(200);
		const rows = list.json();
		expect(rows[0]).toMatchObject({
			serverId,
			metric: "memory",
			threshold: 60,
			enabled: false,
		});
	});

	it("삭제 -> alert-rules 조회", async () => {
		const res = await authedInject(cookie, {
			url: `/alert-rules/${ruleId}`,
			method: "DELETE",
		});
		expect(res.statusCode).toBe(200);

		const list = await authedInject(cookie, {
			url: "/alert-rules",
			method: "GET",
		});

		expect(list.statusCode).toBe(200);
		const rows = list.json();
		expect(rows).toHaveLength(0);
	});

	it("타 org의 실존 서버로 create하면 404 (존재 은폐)", async () => {
		await signUp("user-b@example.com", "User B");
		const cookieB = await signIn("user-b@example.com");
		await createActiveOrg(cookieB, "Org B", "org-b");

		// org-b 세션으로 org-a의 실존 serverId에 ingest 시도
		const res = await authedInject(cookieB, {
			url: "/alert-rules",
			method: "POST",
			body: { serverId, metric: "cpu", threshold: 53.5, enabled: true },
		});
		expect(res.statusCode).toBe(404);
		expect(res.json()).toMatchObject({ code: "SERVER_NOT_FOUND" });
	});

	it("존재하지 않는 서버로 create하면 404", async () => {
		const res = await authedInject(cookie, {
			url: "/alert-rules",
			method: "POST",
			body: { serverId: 2, metric: "cpu", threshold: 53.5, enabled: true },
		});
		expect(res.statusCode).toBe(404);
		expect(res.json()).toMatchObject({ code: "SERVER_NOT_FOUND" });
	});

	it("중복된 rule 추가하면 409", async () => {
		const firstRes = await authedInject(cookie, {
			url: "/alert-rules",
			method: "POST",
			body: {
				serverId: serverId,
				metric: "cpu",
				threshold: 53.5,
				enabled: true,
			},
		});

		expect(firstRes.statusCode).toBe(200);

		const secondRes = await authedInject(cookie, {
			url: "/alert-rules",
			method: "POST",
			body: {
				serverId: serverId,
				metric: "cpu",
				threshold: 53.5,
				enabled: true,
			},
		});
		expect(secondRes.statusCode).toBe(409);
		expect(secondRes.json()).toMatchObject({ code: "DUPLICATE_RULE" });
	});

	it("비로그인 create는 401", async () => {
		const anonymous = await app.inject({
			url: "/alert-rules",
			method: "POST",
			body: { serverId, metric: "cpu", threshold: 53.5, enabled: true },
		});
		expect(anonymous.statusCode).toBe(401);
	});
});

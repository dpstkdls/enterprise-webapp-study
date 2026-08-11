import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { FastifyInstance, InjectOptions } from "fastify";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let container: StartedPostgreSqlContainer;
let pool: Pool;
let db: NodePgDatabase<Record<string, unknown>>;
let app: FastifyInstance;

beforeAll(async () => {
	container = await new PostgreSqlContainer("postgres:17-alpine").start();
	process.env.DATABASE_URL = container.getConnectionUri();
	process.env.REDIS_URL = "redis://localhost:6379"; // 앱이 아직 redis 안 붙어서 더미로 충분

	pool = new Pool({ connectionString: container.getConnectionUri() });
	db = drizzle(pool, { casing: "snake_case" });
	await migrate(db, { migrationsFolder: "./drizzle" });

	const { default: buildApp } = await import("../../app"); // env 세팅 후 import
	app = buildApp();
	await app.ready();
}, 60_000);

afterAll(async () => {
	await app?.close();
	await pool?.end();
	await container?.stop();
});

const cookieOf = (res: { cookies: { name: string; value: string }[] }) =>
	res.cookies.map((c) => `${c.name}=${c.value}`).join("; ");

const authedInject = (cookie: string, opts: InjectOptions) =>
	app.inject({
		...opts,
		headers: {
			Cookie: cookie,
			Origin: "http://localhost:80",
			...opts.headers,
		},
	});

describe("인증 통합 테스트", () => {
	it("전체 흐름", async () => {
		// 계정 생성
		const signUpResponse = await app.inject({
			url: "/api/auth/sign-up/email",
			method: "POST",
			body: {
				name: "Test User",
				email: "user-test@example.com",
				password: "password123",
			},
			headers: {
				Accept: "application/json",
			},
		});

		expect(signUpResponse.statusCode).toBe(200);

		// cookie 없이 GET /servers 요청 시 401
		const serverResponse = await app.inject({
			url: "/servers",
			method: "GET",
		});

		expect(serverResponse.statusCode).toBe(401);

		// 로그인
		const signInResponse = await app.inject({
			url: "/api/auth/sign-in/email",
			method: "POST",
			body: {
				email: "user-test@example.com",
				password: "password123",
			},
			headers: {
				Accept: "application/json",
			},
		});

		const cookieA = cookieOf(signInResponse);
		expect(signInResponse.statusCode).toBe(200);

		// cookie있고 org 없이 GET /servers 요청 시 403 (NO_ACTIVE_ORG)
		const noOrgResponse = await app.inject({
			url: "/servers",
			method: "GET",
			headers: { Cookie: cookieA },
		});
		expect(noOrgResponse.statusCode).toBe(403);
		expect(noOrgResponse.json()).toMatchObject({ code: "NO_ACTIVE_ORG" });

		// org 생성
		const orgCreateResponse = await authedInject(cookieA, {
			url: "/api/auth/organization/create",
			method: "POST",
			body: {
				name: "Test Organization",
				slug: "test-org",
			},
		});

		expect(orgCreateResponse.statusCode).toBe(200);

		const setActiveA = await authedInject(cookieA, {
			url: "/api/auth/organization/set-active",
			method: "POST",
			body: { organizationSlug: "test-org" },
		});

		expect(setActiveA.statusCode).toBe(200);

		// cookie와 org 모두 있는 상태에서 GET /servers 요청 시 200
		const serverCreateResponse = await authedInject(cookieA, {
			url: "/servers",
			method: "POST",
			body: {
				hostname: "web-01",
				ip: "10.0.0.1",
				status: 1,
			},
		});
		expect(serverCreateResponse.statusCode).toBe(200);

		// User B 생성
		const userBCreateResponse = await app.inject({
			url: "/api/auth/sign-up/email",
			method: "POST",
			body: {
				name: "User B",
				email: "user-b@example.com",
				password: "password123",
			},
			headers: {
				Accept: "application/json",
			},
		});
		expect(userBCreateResponse.statusCode).toBe(200);

		// user B로 로그인
		const signInBResponse = await app.inject({
			url: "/api/auth/sign-in/email",
			method: "POST",
			body: {
				email: "user-b@example.com",
				password: "password123",
			},
			headers: {
				Accept: "application/json",
			},
		});
		expect(signInBResponse.statusCode).toBe(200);
		const cookieB = cookieOf(signInBResponse);

		// org B 생성
		const orgBCreateResponse = await authedInject(cookieB, {
			url: "/api/auth/organization/create",
			method: "POST",
			body: {
				name: "Organization B",
				slug: "org-b",
			},
		});
		expect(orgBCreateResponse.statusCode).toBe(200);

		// user B로 org A의 서버에 접근 시 404
		const userAServer = await authedInject(cookieB, {
			url: `/servers/${serverCreateResponse.json().id}`, // org A의 서버 ID
			method: "GET",
		});
		expect(userAServer.statusCode).toBe(404);

		const listB = await authedInject(cookieB, {
			url: `/servers`, // org A의 서버 ID
			method: "GET",
		});
		expect(listB.statusCode).toBe(200);
		expect(listB.json()).toEqual([]);
	});
});

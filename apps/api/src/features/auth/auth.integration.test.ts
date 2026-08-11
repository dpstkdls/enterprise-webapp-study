import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { FastifyInstance, InjectOptions } from "fastify";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PASSWORD = "password123";
const ORIGIN = "http://localhost:80";

let container: StartedPostgreSqlContainer;
let pool: Pool;
let app: FastifyInstance;

beforeAll(async () => {
	container = await new PostgreSqlContainer("postgres:17-alpine").start();
	process.env.DATABASE_URL = container.getConnectionUri();
	process.env.REDIS_URL = "redis://localhost:6379"; // 앱이 아직 redis 안 붙어서 더미로 충분
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

describe("인증 통합", () => {
	let cookieA: string;
	let cookieB: string;
	let serverAId: number;

	it("가입→로그인 사이클로 세션 쿠키를 얻는다", async () => {
		await signUp("user-a@example.com", "User A");
		cookieA = await signIn("user-a@example.com");
		expect(cookieA).toContain("better-auth.session_token");
	});

	it("보호 라우트: 비로그인 401, active org 없으면 403", async () => {
		const anonymous = await app.inject({ url: "/servers", method: "GET" });
		expect(anonymous.statusCode).toBe(401);

		const noOrg = await app.inject({
			url: "/servers",
			method: "GET",
			headers: { Cookie: cookieA },
		});
		expect(noOrg.statusCode).toBe(403);
		expect(noOrg.json()).toMatchObject({ code: "NO_ACTIVE_ORG" });
	});

	it("org 활성화 후 server CRUD가 열린다", async () => {
		await createActiveOrg(cookieA, "Org A", "org-a");

		const created = await authedInject(cookieA, {
			url: "/servers",
			method: "POST",
			body: { hostname: "web-01", ip: "10.0.0.1", status: 1 },
		});
		expect(created.statusCode).toBe(200);
		serverAId = created.json().id;

		const found = await authedInject(cookieA, {
			url: `/servers/${serverAId}`,
			method: "GET",
		});
		expect(found.statusCode).toBe(200);
	});

	it("org 격리: 타 org의 server는 404(존재 은폐), 목록에서도 안 보인다", async () => {
		await signUp("user-b@example.com", "User B");
		cookieB = await signIn("user-b@example.com");
		await createActiveOrg(cookieB, "Org B", "org-b");

		const crossOrg = await authedInject(cookieB, {
			url: `/servers/${serverAId}`,
			method: "GET",
		});
		expect(crossOrg.statusCode).toBe(404);

		const listB = await authedInject(cookieB, {
			url: "/servers",
			method: "GET",
		});
		expect(listB.statusCode).toBe(200);
		expect(listB.json()).toEqual([]);
	});
});

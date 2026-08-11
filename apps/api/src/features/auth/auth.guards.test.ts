import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireOrg } from "./auth.guards";

const makeAuth = (session: unknown) =>
	({ api: { getSession: vi.fn().mockResolvedValue(session) } }) as never;
const makeRequest = () => ({ headers: {} }) as never;

beforeEach(() => {
	vi.resetAllMocks();
});

describe("인증 가드 테스트", () => {
	it("세션 없는 경우", async () => {
		const request = makeRequest();

		await expect(requireOrg(makeAuth(null))(request)).rejects.toMatchObject({
			statusCode: 401,
			code: "UNAUTHORIZED",
			message: "Not signed in",
		});
	});

	it("세션 있지만 OrganizationId 없는 경우", async () => {
		const request = makeRequest();
		const auth = makeAuth({
			user: { id: "user-123" },
			session: { activeOrganizationId: null },
		});

		await expect(requireOrg(auth)(request)).rejects.toMatchObject({
			statusCode: 403,
			code: "NO_ACTIVE_ORG",
			message: "No active organization",
		});
	});

	it("정상 경우", async () => {
		const request = makeRequest();
		const auth = makeAuth({
			user: { id: "user-123" },
			session: { activeOrganizationId: "org-123" },
		});

		await requireOrg(auth)(request);
	});
});

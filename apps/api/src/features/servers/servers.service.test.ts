import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repo from "./servers.repository";
import {
	createServer,
	getServer,
	removeServer,
	updateServer,
} from "./servers.service";

vi.mock("./servers.repository");

const db = {} as never; // Mock database object
const row = {
	id: 1,
	hostname: "my-pc",
	ip: "192.168.10.50",
	status: 1,
	createdAt: new Date("2026-01-01T00:00:00Z"),
	updatedAt: new Date("2026-01-01T12:00:00Z"),
};

beforeEach(() => {
	vi.resetAllMocks();
});

describe("getServer", () => {
	it("찾으면 날짜를 ISO로 직렬화해서 반환", async () => {
		vi.mocked(repo.getById).mockResolvedValue(row);

		const result = await getServer(db, 1);

		expect(result).toEqual({
			...row,
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T12:00:00.000Z",
		});
	});

	it("없으면 404 Error", async () => {
		vi.mocked(repo.getById).mockResolvedValue(undefined);

		await expect(getServer(db, 999)).rejects.toMatchObject({
			statusCode: 404,
			code: "SERVER_NOT_FOUND",
			message: "Server with id 999 not found",
		});
	});
});

describe("createServer", () => {
	it("배열을 단건으로 unwrap", async () => {
		vi.mocked(repo.create).mockResolvedValue([row]);

		const result = await createServer(db, {
			hostname: "solji-pc",
			ip: "192.168.10.51",
			status: 1,
		});

		expect(result.id).toEqual(1);
	});
});

describe("updateServer", () => {
	it("빈 배열이면 404", async () => {
		vi.mocked(repo.update).mockResolvedValue([]);

		await expect(updateServer(db, 999, { status: 0 })).rejects.toMatchObject({
			statusCode: 404,
			code: "SERVER_NOT_FOUND",
			message: "Server with id 999 not found",
		});
	});
});

describe("removeServer", () => {
	it("빈 배열이면 404", async () => {
		vi.mocked(repo.remove).mockResolvedValue([]);

		await expect(removeServer(db, 999)).rejects.toMatchObject({
			statusCode: 404,
			code: "SERVER_NOT_FOUND",
			message: "Server with id 999 not found",
		});
	});
});

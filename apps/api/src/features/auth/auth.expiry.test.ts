import { describe, expect, it } from "vitest";
import { isAccountExpired } from "./auth.expiry";

describe("계정 만료 테스트", () => {
	it("만료 케이스", async () => {
		const result = isAccountExpired(new Date(Date.now() - 1000), new Date()); // true

		expect(result).toBe(true);
	});

	it("만료안된 케이스", async () => {
		const result = isAccountExpired(new Date(Date.now() + 1000), new Date()); // false

		expect(result).toBe(false);
	});

	it("만료일이 없는 케이스(무기한)", async () => {
		const result = isAccountExpired(undefined, new Date()); // false
		expect(result).toBe(false);
	});

	it("정확히 만료일이 현재와 같은 경우", async () => {
		const now = new Date();
		const result = isAccountExpired(now, now); // true
		expect(result).toBe(true);
	});
});

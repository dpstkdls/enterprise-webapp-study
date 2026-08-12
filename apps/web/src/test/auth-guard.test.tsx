import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { server, sessionHandler } from "./msw";
import { renderAt } from "./render";

describe("라우트 가드", () => {
	it("비로그인으로 /servers 접근하면 로그인 페이지로 리다이렉트", async () => {
		server.use(sessionHandler(null));
		const router = renderAt("/servers");

		// CardTitle은 heading role이 아니라 div — 로그인 폼의 이메일 입력으로 확인
		expect(await screen.findByLabelText("이메일")).toBeInTheDocument();
		expect(router.state.location.pathname).toBe("/login");
	});

	it("로그인 된 상태면 /servers 접근 가능", async () => {
		const router = renderAt("/servers");

		expect(
			await screen.findByRole("heading", { name: "서버 목록" }),
		).toBeInTheDocument();
		expect(router.state.location.pathname).toBe("/servers");
	});
});

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "./msw";
import { renderAt } from "./render";

describe("로그인 페이지", () => {
	it("로그인 실패(서버 검증 400) 시 에러 문구", async () => {
		server.use(
			http.post("http://localhost:3000/api/auth/sign-in/email", () =>
				HttpResponse.json({ message: "유효하지 않은 계정" }, { status: 400 }),
			),
		);

		renderAt("/login");
		const user = userEvent.setup();

		await user.type(await screen.findByLabelText("이메일"), "test@test.com");
		await user.type(screen.getByLabelText("비밀번호"), "practice-1234");
		await user.click(screen.getByRole("button", { name: "로그인" }));

		expect(await screen.findByText("유효하지 않은 계정")).toBeInTheDocument();
	});

	it("로그인 성공 시 /로 이동", async () => {
		server.use(
			http.post("http://localhost:3000/api/auth/sign-in/email", () =>
				HttpResponse.json({ message: "로그인 성공" }, { status: 200 }),
			),
		);
		const router = renderAt("/login");
		const user = userEvent.setup();

		await user.type(await screen.findByLabelText("이메일"), "test@test.com");
		await user.type(screen.getByLabelText("비밀번호"), "practice-1234");
		await user.click(screen.getByRole("button", { name: "로그인" }));

		await waitFor(() => expect(router.state.location.pathname).toBe("/"));
	});
});

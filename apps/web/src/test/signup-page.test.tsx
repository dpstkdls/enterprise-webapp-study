import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "./msw";
import { renderAt } from "./render";

describe("회원가입 페이지", () => {
	it("회원가입 실패(서버 검증 400) 시 에러 문구", async () => {
		server.use(
			http.post("http://localhost:3000/api/auth/sign-up/email", () =>
				HttpResponse.json({ message: "가입 실패" }, { status: 400 }),
			),
		);

		renderAt("/signup");
		const user = userEvent.setup();

		await user.type(await screen.findByLabelText("이름"), "테스트 이름");
		await user.type(await screen.findByLabelText("이메일"), "test@test.com");
		await user.type(screen.getByLabelText("비밀번호"), "practice-1234");
		await user.click(screen.getByRole("button", { name: "가입" }));

		expect(await screen.findByText("가입 실패")).toBeInTheDocument();
	});

	it("회원가입 성공 시 /로 이동", async () => {
		server.use(
			http.post("http://localhost:3000/api/auth/sign-up/email", () =>
				HttpResponse.json({ message: "회원가입 성공" }, { status: 200 }),
			),
		);
		const router = renderAt("/signup");
		const user = userEvent.setup();

		await user.type(await screen.findByLabelText("이름"), "테스트 이름");
		await user.type(await screen.findByLabelText("이메일"), "test@test.com");
		await user.type(screen.getByLabelText("비밀번호"), "practice-1234");
		await user.click(screen.getByRole("button", { name: "가입" }));

		await waitFor(() => expect(router.state.location.pathname).toBe("/"));
	});
});

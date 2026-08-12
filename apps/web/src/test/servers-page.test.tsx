import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "./msw";
import { renderAt } from "./render";

describe("서버 목록 페이지", () => {
	it("로딩 후 목록 표시", async () => {
		renderAt("/servers");

		expect(await screen.findByText("불러오는 중...")).toBeInTheDocument();
		expect(await screen.findByText("web-01")).toBeInTheDocument();
	});

	it("조회 실패 시 에러 문구", async () => {
		server.use(
			http.get("http://localhost:3000/servers", () =>
				HttpResponse.json({ message: "boom" }, { status: 500 }),
			),
		);

		renderAt("/servers");

		expect(await screen.findByText("목록 조회 실패")).toBeInTheDocument();
	});

	it("등록 실패(서버 검증 400) 시 에러 문구", async () => {
		server.use(
			http.post("http://localhost:3000/servers", () =>
				HttpResponse.json({ message: "invalid" }, { status: 400 }),
			),
		);

		renderAt("/servers");
		const user = userEvent.setup();

		await user.type(await screen.findByLabelText("호스트명"), "bad");
		await user.type(screen.getByLabelText("IP"), "999.999.999.999");
		await user.click(screen.getByRole("button", { name: "등록" }));

		expect(await screen.findByText("등록 실패")).toBeInTheDocument();
	});
});

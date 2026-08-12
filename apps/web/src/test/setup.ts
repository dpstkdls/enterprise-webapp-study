import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach } from "vitest";
import { server } from "./msw";

// beforeAll이 아닌 모듈 최상단에서 listen — 테스트 모듈이 import되기 전에
// fetch를 패치해야 better-auth(better-fetch)가 패치된 fetch를 잡는다
server.listen({ onUnhandledRequest: "error" });

// RTL 자동 cleanup은 globals: true에서만 걸림 — 명시 import 방식이라 수동 등록
afterEach(() => {
	cleanup();
	server.resetHandlers();
});
afterAll(() => server.close());

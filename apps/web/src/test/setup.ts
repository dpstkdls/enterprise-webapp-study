import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, vi } from "vitest";
import { server } from "./msw";

// beforeAll이 아닌 모듈 최상단에서 listen — 테스트 모듈이 import되기 전에
// fetch를 패치해야 better-auth(better-fetch)가 패치된 fetch를 잡는다
server.listen({ onUnhandledRequest: "error" });

// MSW는 WebSocket을 안 가로챈다 — useMetricsStream이 테스트에서 진짜 연결을
// 시도하면 CI 타이밍에 따라 error 이벤트가 새는 플레이키. 무해한 스텁으로 교체
class StubWebSocket {
	static last: StubWebSocket | null = null;
	onopen: ((e: unknown) => void) | null = null;
	onmessage: ((e: unknown) => void) | null = null;
	onclose: ((e: unknown) => void) | null = null;
	onerror: ((e: unknown) => void) | null = null;
	constructor() {
		StubWebSocket.last = this;
	}
	send() {}
	close() {}
}
vi.stubGlobal("WebSocket", StubWebSocket);

// RTL 자동 cleanup은 globals: true에서만 걸림 — 명시 import 방식이라 수동 등록
afterEach(() => {
	cleanup();
	server.resetHandlers();
});
afterAll(() => server.close());

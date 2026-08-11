import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/servers")({
	component: () => <h1>서버 목록 (플레이스홀더)</h1>,
});

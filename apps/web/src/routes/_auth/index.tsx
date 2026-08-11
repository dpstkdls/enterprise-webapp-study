import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/")({
	component: () => <h1>홈</h1>,
});

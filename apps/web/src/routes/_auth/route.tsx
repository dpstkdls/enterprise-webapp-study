import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "../../features/auth/auth.client";

export const Route = createFileRoute("/_auth")({
	beforeLoad: async () => {
		const { data: session } = await authClient.getSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { session };
	},
	component: () => <Outlet />,
});

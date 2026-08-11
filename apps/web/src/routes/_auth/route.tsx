import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { Button } from "@/shared/ui/button";
import { authClient } from "../../features/auth/auth.client";

export const Route = createFileRoute("/_auth")({
	beforeLoad: async () => {
		const { data: session } = await authClient.getSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { session };
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	const { data: session } = authClient.useSession();
	const navigate = useNavigate();

	const onLogout = async () => {
		await authClient.signOut();
		navigate({ to: "/login" });
	};

	return (
		<div className="flex min-h-screen">
			<aside className="flex w-56 flex-col gap-4 border-r p-4">
				<div className="font-semibold">EWS</div>
				<nav className="flex flex-col gap-1 text-sm">
					<Link
						to="/servers"
						className="rounded px-2 hover:bg-accent [&.accent]:bg-accent [&.active]:font-medium"
					>
						서버
					</Link>
				</nav>
			</aside>
			<div className="flex flex-1 flex-col">
				<header className="flex items-center justify-end gap-3 border-b px-6 py-3 text-sm">
					<span className="text-muted-foreground">{session?.user.email}</span>
					<Button variant="outline" size="sm" onClick={onLogout}>
						로그아웃
					</Button>
				</header>
				<main className="flex-1 p-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

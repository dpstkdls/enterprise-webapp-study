import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { authClient } from "../features/auth/auth.client";

function RootLayout() {
	const { data: session } = authClient.useSession();

	return (
		<>
			<nav>
				<Link to="/">홈</Link> <Link to="/servers">서버</Link>{" "}
				{session ? (
					<>
						{session.user.email}{" "}
						<button type="button" onClick={() => authClient.signOut()}>
							로그아웃
						</button>
					</>
				) : (
					<Link to="/login">로그인</Link>
				)}
			</nav>
			<Outlet />
			<TanStackRouterDevtools />
			<ReactQueryDevtools />
		</>
	);
}

export const Route = createRootRoute({ component: RootLayout });

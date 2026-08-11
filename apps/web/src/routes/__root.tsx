import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
	component: () => (
		<>
			<nav>
				<Link to="/">홈</Link> <Link to="/servers">서버</Link>
			</nav>
			<Outlet />
			<TanStackRouterDevtools />
			<ReactQueryDevtools />
		</>
	),
});

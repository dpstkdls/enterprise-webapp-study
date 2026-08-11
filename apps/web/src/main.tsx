import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const root = document.getElementById("root");
const router = createRouter({ routeTree });
const queryClient = new QueryClient();

if (!root) throw new Error("#root not found");
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

createRoot(root).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	</StrictMode>,
);

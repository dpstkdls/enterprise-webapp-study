import { queryOptions } from "@tanstack/react-query";
import { fetchServers } from "./servers.api";

export const serversQuery = (orgId: string) =>
	queryOptions({
		queryKey: ["servers", orgId],
		queryFn: fetchServers,
	});

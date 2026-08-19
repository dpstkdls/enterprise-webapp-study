import { queryOptions } from "@tanstack/react-query";
import { fetchAlertRules } from "./alert-rules.api";

export const alertRulesQuery = (orgId: string) =>
	queryOptions({
		queryKey: ["alert-rules", orgId],
		queryFn: fetchAlertRules,
	});

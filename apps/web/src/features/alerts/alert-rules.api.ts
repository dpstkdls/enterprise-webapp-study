import { api } from "../../shared/api/client";
import type { paths } from "../../shared/api/schema";

export type CreateRuleBody =
	paths["/alert-rules"]["post"]["requestBody"]["content"]["application/json"];

export type UpdateRuleBody =
	paths["/alert-rules/{id}"]["patch"]["requestBody"]["content"]["application/json"];

export async function fetchAlertRules() {
	const { data, error } = await api.GET("/alert-rules");
	if (error) throw error;
	return data;
}

export async function createAlertRule(body: CreateRuleBody) {
	const { data, error } = await api.POST("/alert-rules", { body });
	if (error) throw error;
	return data;
}

export async function updateAlertRule(id: number, body: UpdateRuleBody) {
	const { data, error } = await api.PATCH("/alert-rules/{id}", {
		params: { path: { id } },
		body,
	});
	if (error) throw error;
	return data;
}

export async function deleteAlertRule(id: number) {
	const { data, error } = await api.DELETE("/alert-rules/{id}", {
		params: { path: { id } },
	});
	if (error) throw error;
	return data;
}

import { api } from "../../shared/api/client";

export async function fetchServers() {
	const { data, error } = await api.GET("/servers");
	if (error) throw error;
	return data;
}

export async function createServer(body: {
	hostname: string;
	ip: string;
	status: number;
}) {
	const { data, error } = await api.POST("/servers", { body });
	if (error) throw error;
	return data;
}

export async function updateServer(
	id: number,
	body: { hostname?: string; ip?: string; status?: number },
) {
	const { data, error } = await api.PATCH("/servers/{id}", {
		params: { path: { id } },
		body,
	});
	if (error) throw error;
	return data;
}

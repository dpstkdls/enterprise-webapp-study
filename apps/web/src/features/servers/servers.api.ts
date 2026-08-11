import { api } from "../../shared/api/client";

export async function fetchServers() {
	const { data, error } = await api.GET("/servers");
	if (error) throw error;
	return data;
}

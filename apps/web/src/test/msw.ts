import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import type { paths } from "../shared/api/schema";

type ServersResponse =
	paths["/servers"]["get"]["responses"]["200"]["content"]["application/json"];

export const mockServers: ServersResponse = [
	{
		id: 1,
		hostname: "web-01",
		ip: "10.0.0.1",
		status: 1,
		createdAt: "2026-08-11T00:00:00.000Z",
		updatedAt: "2026-08-11T00:00:00.000Z",
	},
];

export const mockSession = {
	session: { id: "s1", userId: "u1", activeOrganizationId: "org-1" },
	user: { id: "u1", email: "phase3@test.com", name: "phase3" },
};

export const sessionHandler = (session: typeof mockSession | null) =>
	http.get("http://localhost:3000/api/auth/get-session", () =>
		HttpResponse.json(session),
	);

export const handlers = [
	http.get("http://localhost:3000/servers", () =>
		HttpResponse.json(mockServers),
	),
	sessionHandler(mockSession),
];

export const server = setupServer(...handlers);

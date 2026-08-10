import type { FastifyRequest } from "fastify";
import { AppError } from "../../infra/errors";
import type { createAuth } from "./auth";
import { toWebHeaders } from "./auth.headers";

export const requireAdmin =
	(auth: ReturnType<typeof createAuth>) => async (request: FastifyRequest) => {
		const headers = toWebHeaders(request);

		const session = await auth.api.getSession({ headers });
		if (!session) throw new AppError(401, "UNAUTHORIZED", "Not signed in");
		if (session.user.role !== "admin")
			throw new AppError(403, "FORBIDDEN", "Admin only");
	};

export const requireOrg =
	(auth: ReturnType<typeof createAuth>) => async (request: FastifyRequest) => {
		const session = await auth.api.getSession({
			headers: toWebHeaders(request),
		});
		if (!session) throw new AppError(401, "UNAUTHORIZED", "Not signed in");
		const orgId = session.session.activeOrganizationId;
		if (!orgId)
			throw new AppError(403, "NO_ACTIVE_ORG", "No active organization");
		request.orgId = orgId;
	};

declare module "fastify" {
	interface FastifyRequest {
		orgId: string;
	}
}

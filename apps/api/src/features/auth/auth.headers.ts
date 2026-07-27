import type { FastifyRequest } from "fastify";

export const toWebHeaders = (request: FastifyRequest) => {
	const headers = new Headers();
	for (const [key, value] of Object.entries(request.headers)) {
		if (value) headers.append(key, value.toString());
	}
	return headers;
};

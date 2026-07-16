import { STATUS_CODES } from "node:http";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError, type ErrorResponse } from "./errors";

const problem = (
	req: FastifyRequest,
	reply: FastifyReply,
	p: Pick<ErrorResponse, "status" | "code" | "detail" | "errors">,
) => {
	const body: ErrorResponse = {
		type: "about:blank",
		title: STATUS_CODES[p.status] || "Unknown Error",
		requestId: req.id,
		...p,
	};
	return reply.status(body.status).type("application/problem+json").send(body);
};

export const AppErrorHandler = (
	err: FastifyError,
	req: FastifyRequest,
	reply: FastifyReply,
) => {
	if (err instanceof AppError) {
		return problem(req, reply, {
			status: err.statusCode,
			code: err.code,
			detail: err.message,
		});
	}
	if (err instanceof ZodError) {
		return problem(req, reply, {
			status: 400,
			code: "VALIDATION_ERROR",
			errors: err.issues.map((i) => ({
				path: i.path.join("."),
				message: i.message,
			})),
		});
	}
	if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
		return problem(req, reply, {
			status: err.statusCode,
			code: err.code,
			detail: err.message,
		});
	}

	req.log.error({ err }, "unhandled error");
	return problem(req, reply, {
		status: 500,
		code: "INTERNAL_SERVER_ERROR",
	});
};

export const NotFoundErrorHandler = (
	req: FastifyRequest,
	reply: FastifyReply,
) =>
	problem(req, reply, {
		status: 404,
		code: "NOT_FOUND",
	});

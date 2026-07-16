import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { healthRoute } from "./features/health/health.routes";
import configPlugin from "./infra/config";
import connectDbPlugin from "./infra/db";
import { AppErrorHandler, NotFoundErrorHandler } from "./infra/error-handler";
import { loggerOptions } from "./infra/logger";

const buildApp = () => {
	const fastify = Fastify({
		logger: loggerOptions,
		requestIdHeader: "x-request-id",
		genReqId: () => randomUUID(),
		requestIdLogLabel: "requestId",
	});

	fastify.addHook("onRequest", (req, reply, done) => {
		reply.header("x-request-id", req.id);
		done();
	});

	fastify.setErrorHandler(AppErrorHandler);
	fastify.setNotFoundHandler(NotFoundErrorHandler);

	fastify.register(configPlugin);
	fastify.register(connectDbPlugin);

	fastify.register(healthRoute);
	return fastify;
};

export default buildApp;

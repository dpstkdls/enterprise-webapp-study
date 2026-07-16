import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { healthRoute } from "./features/health/health.routes.js";
import configPlugin from "./infra/config.js";
import { loggerOptions } from "./infra/logger.js";

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

	fastify.register(configPlugin);
	fastify.register(healthRoute);
	return fastify;
};

export default buildApp;

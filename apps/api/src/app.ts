import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { authRoute } from "./features/auth/auth.route";
import { healthRoute } from "./features/health/health.routes";
import { serversRoute } from "./features/servers/servers.route";
import configPlugin from "./infra/config";
import connectDbPlugin from "./infra/db";
import { AppErrorHandler, NotFoundErrorHandler } from "./infra/error-handler";
import { loggerOptions } from "./infra/logger";
import swaggerPlugin from "./infra/swagger";

const buildApp = () => {
	const fastify = Fastify({
		logger: loggerOptions,
		requestIdHeader: "x-request-id",
		genReqId: () => randomUUID(),
		requestIdLogLabel: "requestId",
	}).withTypeProvider<ZodTypeProvider>();

	fastify.setValidatorCompiler(validatorCompiler);
	fastify.setSerializerCompiler(serializerCompiler);

	fastify.addHook("onRequest", (req, reply, done) => {
		reply.header("x-request-id", req.id);
		done();
	});

	fastify.setErrorHandler(AppErrorHandler);
	fastify.setNotFoundHandler(NotFoundErrorHandler);

	fastify.register(configPlugin);
	fastify.register(connectDbPlugin);
	fastify.register(swaggerPlugin);

	fastify.register(healthRoute);
	fastify.register(authRoute);
	fastify.register(serversRoute);
	return fastify;
};

export default buildApp;

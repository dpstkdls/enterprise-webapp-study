import Fastify from "fastify";
import { healthRoute } from "./features/health/health.routes.js";
import configPlugin from "./infra/config.js";

const buildApp = () => {
	const fastify = Fastify({
		logger: true,
	});

	fastify.register(configPlugin);
	fastify.register(healthRoute);
	return fastify;
};

export default buildApp;

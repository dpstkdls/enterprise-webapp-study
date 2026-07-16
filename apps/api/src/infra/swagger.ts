import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
	await fastify.register(swagger, {
		openapi: {
			info: {
				title: "My API",
				description: "API documentation",
				version: "1.0.0",
			},
		},
		transform: jsonSchemaTransform,
	});

	await fastify.register(swaggerUi, {
		routePrefix: "/docs",
		uiConfig: {
			docExpansion: "full",
			deepLinking: false,
		},
	});
};

export default fp(swaggerPlugin);

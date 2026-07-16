import type { FastifyServerOptions } from "fastify";

export const loggerOptions: FastifyServerOptions["logger"] =
	process.env.NODE_ENV === "production"
		? {
				level: "info",
				redact: ["req.headers.authorization", "req.headers.cookie"],
			}
		: {
				level: "debug",
				redact: ["req.headers.authorization", "req.headers.cookie"],
				transport: { target: "pino-pretty" },
				serializers: {
					req(req) {
						return { method: req.method, url: req.url, headers: req.headers };
					},
				},
			};

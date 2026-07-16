import buildApp from "./app";

const start = async () => {
	const server = buildApp();

	const shutdown = async (signal: string) => {
		server.log.info(`${signal} received, closing server...`);
		await server.close();
		process.exit(0);
	};

	process.on("SIGINT", () => void shutdown("SIGINT"));
	process.on("SIGTERM", () => void shutdown("SIGTERM"));

	try {
		await server.listen({ port: 3000 });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

start();

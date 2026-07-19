import { drizzle } from "drizzle-orm/node-postgres";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Pool } from "pg";

declare module "fastify" {
	interface FastifyInstance {
		db: ReturnType<typeof drizzle>;
	}
}

const connectDbPlugin: FastifyPluginAsync = async (fastify, _opts) => {
	const pool = new Pool({
		connectionString: fastify.config.DATABASE_URL,
	});
	const db = drizzle(pool, { casing: "snake_case" });

	await pool.query("SELECT 1"); // Test the connection

	fastify.decorate("db", db);

	fastify.addHook("onClose", async (instance) => {
		instance.log.info("Closing database connection...");
		await pool.end();
	});
};

export default fp(connectDbPlugin);

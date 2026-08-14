import { Queue, Worker } from "bullmq";
import type { FastifyPluginAsync } from "fastify";
import IORedis from "ioredis";
import { rollupMetrics } from "../features/metrics/metrics.rollup";

declare module "fastify" {
	interface FastifyInstance {
		queues: { metricsRollup: Queue };
	}
}

const queuePlugin: FastifyPluginAsync = async (fastify) => {
	const connection = new IORedis(fastify.config.REDIS_URL, {
		maxRetriesPerRequest: null,
	});

	const metricsRollup = new Queue("metrics-rollup", { connection });

	const worker = new Worker(
		"metrics-rollup",
		async () => {
			const result = await rollupMetrics(fastify.db, new Date());
			fastify.log.info(result, "Metrics rollup 완료");
		},
		{ connection },
	);

	worker.on("failed", (job, err) => {
		fastify.log.error({ err, jobId: job?.id }, "metrics rollup 실패");
	});

	await metricsRollup.upsertJobScheduler("rollup-every-minute", {
		every: 60_000, // 1분마다 실행
	});

	fastify.decorate("queues", { metricsRollup });
	fastify.addHook("onClose", async () => {
		await worker.close();
		await metricsRollup.close();
		await connection.quit();
	});
};

export default queuePlugin;

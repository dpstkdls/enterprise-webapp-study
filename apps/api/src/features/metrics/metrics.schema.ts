import {
	doublePrecision,
	integer,
	pgTable,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { servers } from "../servers/servers.schema";

export const metrics = pgTable("metrics", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	serverId: integer()
		.notNull()
		.references(() => servers.id),
	cpu: doublePrecision("cpu").notNull(),
	memory: doublePrecision("memory").notNull(),
	createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const metricsRollup = pgTable(
	"metrics_rollup",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		serverId: integer()
			.notNull()
			.references(() => servers.id),
		bucketStart: timestamp({ withTimezone: true }).notNull(),
		cpuAvg: doublePrecision().notNull(),
		cpuMax: doublePrecision().notNull(),
		memoryAvg: doublePrecision().notNull(),
		memoryMax: doublePrecision().notNull(),
		sampleCount: integer().notNull(),
	},
	(t) => [unique().on(t.serverId, t.bucketStart)],
);

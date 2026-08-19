import {
	boolean,
	doublePrecision,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";
import { servers } from "../servers/servers.schema";

export const alertRules = pgTable(
	"alert_rules",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		serverId: integer()
			.notNull()
			.references(() => servers.id),
		metric: text({ enum: ["cpu", "memory"] }).notNull(),
		threshold: doublePrecision("threshold").notNull(),
		enabled: boolean().notNull().default(true),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(t) => [unique().on(t.serverId, t.metric)],
);

export type AlertMetric = (typeof alertRules.$inferSelect)["metric"];

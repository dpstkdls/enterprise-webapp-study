import {
	doublePrecision,
	integer,
	pgTable,
	timestamp,
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

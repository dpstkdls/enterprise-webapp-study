import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const servers = pgTable("servers", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	hostname: varchar().notNull(),
	ip: varchar().notNull(),
	status: integer().notNull(),
	createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true })
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});

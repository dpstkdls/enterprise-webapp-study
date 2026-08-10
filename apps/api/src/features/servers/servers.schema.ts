import {
	integer,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { organization } from "../auth/auth.schema";

export const servers = pgTable("servers", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	hostname: varchar().notNull(),
	ip: varchar().notNull(),
	status: integer().notNull(),
	organizationId: text()
		.notNull()
		.references(() => organization.id),
	createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true })
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});

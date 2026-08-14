CREATE TABLE "metrics_rollup" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "metrics_rollup_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"server_id" integer NOT NULL,
	"bucket_start" timestamp with time zone NOT NULL,
	"cpu_avg" double precision NOT NULL,
	"cpu_max" double precision NOT NULL,
	"memory_avg" double precision NOT NULL,
	"memory_max" double precision NOT NULL,
	"sample_count" integer NOT NULL,
	CONSTRAINT "metrics_rollup_serverId_bucketStart_unique" UNIQUE("server_id","bucket_start")
);
--> statement-breakpoint
ALTER TABLE "metrics_rollup" ADD CONSTRAINT "metrics_rollup_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE no action ON UPDATE no action;
CREATE TYPE "public"."run_status" AS ENUM('success', 'failed', 'timeout');--> statement-breakpoint
CREATE TYPE "public"."scheduled_job_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "public"."scheduled_job_type" AS ENUM('http', 'reminder');--> statement-breakpoint
CREATE TABLE "scheduled_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"status" "scheduled_job_status" DEFAULT 'active' NOT NULL,
	"type" "scheduled_job_type" DEFAULT 'http' NOT NULL,
	"schedule" text NOT NULL,
	"http_url" text,
	"http_method" text DEFAULT 'GET' NOT NULL,
	"http_headers" jsonb,
	"http_body" text,
	"timeout_ms" integer DEFAULT 30000 NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"status" "run_status" NOT NULL,
	"response_code" integer,
	"response_time_ms" integer,
	"response_body" text,
	"error_message" text,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scheduled_jobs" ADD CONSTRAINT "scheduled_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_runs" ADD CONSTRAINT "scheduled_runs_job_id_scheduled_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."scheduled_jobs"("id") ON DELETE cascade ON UPDATE no action;
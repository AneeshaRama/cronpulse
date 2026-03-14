import { createId } from "@paralleldrive/cuid2";
import type { AdapterAccountType } from "next-auth/adapters";
import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// Enums
export const monitorStatusEnum = pgEnum("monitor_status", [
  "pending",
  "healthy",
  "late",
  "down",
]);

export const alertChannelTypeEnum = pgEnum("alert_channel_type", [
  "email",
  "slack",
  "discord",
  "telegram",
  "webhook",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "pending",
  "sent",
  "failed",
]);

export const scheduledJobStatusEnum = pgEnum("scheduled_job_status", [
  "active",
  "paused",
]);

export const scheduledJobTypeEnum = pgEnum("scheduled_job_type", [
  "http",
  "reminder",
]);

export const runStatusEnum = pgEnum("run_status", [
  "success",
  "failed",
  "timeout",
]);

// Tables
export const users = pgTable("users", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name"),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").$type<AdapterAccountType>().notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

export const projects = pgTable("projects", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull().default("My Project"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const monitors = pgTable("monitors", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  projectId: text("project_id")
    .references(() => projects.id)
    .notNull(),
  name: text("name").notNull(),
  status: monitorStatusEnum("status").notNull().default("pending"),
  schedule: text("schedule").notNull(),
  gracePeriod: integer("grace_period").notNull().default(300),
  pingUrl: text("ping_url")
    .$defaultFn(() => createId())
    .notNull()
    .unique(),
  lastPingAt: timestamp("last_ping_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pings = pgTable("pings", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  monitorId: text("monitor_id")
    .references(() => monitors.id)
    .notNull(),
  pingedAt: timestamp("pinged_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alertChannels = pgTable("alert_channels", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  projectId: text("project_id")
    .references(() => projects.id)
    .notNull(),
  type: alertChannelTypeEnum("type").notNull(),
  config: jsonb("config").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scheduledJobs = pgTable("scheduled_jobs", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  projectId: text("project_id")
    .references(() => projects.id)
    .notNull(),
  name: text("name").notNull(),
  status: scheduledJobStatusEnum("status").notNull().default("active"),
  type: scheduledJobTypeEnum("type").notNull().default("http"),
  schedule: text("schedule").notNull(),
  httpUrl: text("http_url"),
  httpMethod: text("http_method").notNull().default("GET"),
  httpHeaders: jsonb("http_headers"),
  httpBody: text("http_body"),
  timeoutMs: integer("timeout_ms").notNull().default(30000),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scheduledRuns = pgTable("scheduled_runs", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  jobId: text("job_id")
    .references(() => scheduledJobs.id, { onDelete: "cascade" })
    .notNull(),
  status: runStatusEnum("status").notNull(),
  responseCode: integer("response_code"),
  responseTimeMs: integer("response_time_ms"),
  responseBody: text("response_body"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alertQueue = pgTable("alert_queue", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  monitorId: text("monitor_id")
    .references(() => monitors.id)
    .notNull(),
  alertChannelId: text("alert_channel_id")
    .references(() => alertChannels.id)
    .notNull(),
  status: alertStatusEnum("status").notNull().default("pending"),
  payload: jsonb("payload").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastAttemptedAt: timestamp("last_attempted_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

import { testDb } from "./setup";
import { users, projects, monitors, alertChannels } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

export async function createTestUser(
  overrides: { email?: string; name?: string; password?: string } = {},
) {
  const email = overrides.email ?? `test-${createId()}@example.com`;
  const hashedPassword = await bcrypt.hash(overrides.password ?? "password123", 12);

  const user = await testDb
    .insert(users)
    .values({
      id: createId(),
      email,
      name: overrides.name ?? "Test User",
      password: hashedPassword,
    })
    .returning()
    .then((rows) => rows[0]);

  return user;
}

export async function createTestProject(userId: string, name = "Test Project") {
  const project = await testDb
    .insert(projects)
    .values({
      id: createId(),
      userId,
      name,
    })
    .returning()
    .then((rows) => rows[0]);

  return project;
}

export async function createTestMonitor(
  projectId: string,
  overrides: {
    name?: string;
    schedule?: string;
    gracePeriod?: number;
    status?: "pending" | "healthy" | "late" | "down";
    lastPingAt?: Date | null;
  } = {},
) {
  const monitor = await testDb
    .insert(monitors)
    .values({
      id: createId(),
      projectId,
      name: overrides.name ?? "Test Monitor",
      schedule: overrides.schedule ?? "* * * * *",
      gracePeriod: overrides.gracePeriod ?? 300,
      pingUrl: createId(),
      status: overrides.status ?? "pending",
      lastPingAt: overrides.lastPingAt ?? null,
    })
    .returning()
    .then((rows) => rows[0]);

  return monitor;
}

export async function createTestAlertChannel(
  projectId: string,
  overrides: {
    type?: "email" | "slack" | "discord" | "telegram" | "webhook";
    config?: Record<string, unknown>;
    enabled?: boolean;
  } = {},
) {
  const channel = await testDb
    .insert(alertChannels)
    .values({
      id: createId(),
      projectId,
      type: overrides.type ?? "email",
      config: overrides.config ?? { email: "test@example.com" },
      enabled: overrides.enabled ?? true,
    })
    .returning()
    .then((rows) => rows[0]);

  return channel;
}

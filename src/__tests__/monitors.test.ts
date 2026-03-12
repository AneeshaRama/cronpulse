import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { testDb } from "./setup";
import { monitors } from "@/lib/db/schema";
import {
  createTestUser,
  createTestProject,
  createTestMonitor,
} from "./helpers";

describe("Monitors - CRUD", () => {
  it("should create a monitor with pending status and a ping URL", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    const monitor = await createTestMonitor(project.id, {
      name: "Database Backup",
      schedule: "0 0 * * *",
      gracePeriod: 600,
    });

    expect(monitor).toBeDefined();
    expect(monitor.name).toBe("Database Backup");
    expect(monitor.status).toBe("pending");
    expect(monitor.schedule).toBe("0 0 * * *");
    expect(monitor.gracePeriod).toBe(600);
    expect(monitor.pingUrl).toBeDefined();
    expect(monitor.pingUrl.length).toBeGreaterThan(0);
    expect(monitor.lastPingAt).toBeNull();
  });

  it("should create multiple monitors under one project", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);

    await createTestMonitor(project.id, { name: "Job 1" });
    await createTestMonitor(project.id, { name: "Job 2" });
    await createTestMonitor(project.id, { name: "Job 3" });

    const allMonitors = await testDb
      .select()
      .from(monitors)
      .where(eq(monitors.projectId, project.id));

    expect(allMonitors).toHaveLength(3);
    const names = allMonitors.map((m) => m.name).sort();
    expect(names).toEqual(["Job 1", "Job 2", "Job 3"]);
  });

  it("should update a monitor", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    const monitor = await createTestMonitor(project.id);

    const updated = await testDb
      .update(monitors)
      .set({
        name: "Updated Name",
        schedule: "*/10 * * * *",
        gracePeriod: 120,
        updatedAt: new Date(),
      })
      .where(eq(monitors.id, monitor.id))
      .returning()
      .then((rows) => rows[0]);

    expect(updated.name).toBe("Updated Name");
    expect(updated.schedule).toBe("*/10 * * * *");
    expect(updated.gracePeriod).toBe(120);
  });

  it("should delete a monitor", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    const monitor = await createTestMonitor(project.id);

    await testDb.delete(monitors).where(eq(monitors.id, monitor.id));

    const result = await testDb
      .select()
      .from(monitors)
      .where(eq(monitors.id, monitor.id));

    expect(result).toHaveLength(0);
  });

  it("should have unique ping URLs across monitors", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);

    const m1 = await createTestMonitor(project.id, { name: "Monitor 1" });
    const m2 = await createTestMonitor(project.id, { name: "Monitor 2" });

    expect(m1.pingUrl).not.toBe(m2.pingUrl);
  });
});

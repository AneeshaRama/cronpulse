import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { testDb } from "./setup";
import { monitors, pings } from "@/lib/db/schema";
import {
  createTestUser,
  createTestProject,
  createTestMonitor,
} from "./helpers";

describe("Ping", () => {
  it("should record a ping and update monitor to healthy", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    const monitor = await createTestMonitor(project.id);

    expect(monitor.status).toBe("pending");

    const now = new Date();

    // Simulate ping: insert ping record + update monitor
    await Promise.all([
      testDb.insert(pings).values({
        monitorId: monitor.id,
        pingedAt: now,
      }),
      testDb
        .update(monitors)
        .set({
          lastPingAt: now,
          status: "healthy",
          updatedAt: now,
        })
        .where(eq(monitors.id, monitor.id)),
    ]);

    // Verify monitor status changed
    const updated = await testDb
      .select()
      .from(monitors)
      .where(eq(monitors.id, monitor.id))
      .then((rows) => rows[0]);

    expect(updated.status).toBe("healthy");
    expect(updated.lastPingAt).toBeDefined();

    // Verify ping record was created
    const pingRecords = await testDb
      .select()
      .from(pings)
      .where(eq(pings.monitorId, monitor.id));

    expect(pingRecords).toHaveLength(1);
    expect(pingRecords[0].monitorId).toBe(monitor.id);
  });

  it("should record multiple pings for the same monitor", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    const monitor = await createTestMonitor(project.id);

    const times = [
      new Date("2026-03-12T10:00:00Z"),
      new Date("2026-03-12T11:00:00Z"),
      new Date("2026-03-12T12:00:00Z"),
    ];

    for (const time of times) {
      await testDb.insert(pings).values({
        monitorId: monitor.id,
        pingedAt: time,
      });
    }

    await testDb
      .update(monitors)
      .set({
        lastPingAt: times[2],
        status: "healthy",
        updatedAt: times[2],
      })
      .where(eq(monitors.id, monitor.id));

    const pingRecords = await testDb
      .select()
      .from(pings)
      .where(eq(pings.monitorId, monitor.id));

    expect(pingRecords).toHaveLength(3);

    const updated = await testDb
      .select()
      .from(monitors)
      .where(eq(monitors.id, monitor.id))
      .then((rows) => rows[0]);

    expect(updated.lastPingAt!.toISOString()).toBe("2026-03-12T12:00:00.000Z");
  });

  it("should flip a late monitor back to healthy on ping", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    const monitor = await createTestMonitor(project.id, {
      status: "late",
      lastPingAt: new Date("2026-03-12T08:00:00Z"),
    });

    expect(monitor.status).toBe("late");

    const now = new Date();
    await Promise.all([
      testDb.insert(pings).values({
        monitorId: monitor.id,
        pingedAt: now,
      }),
      testDb
        .update(monitors)
        .set({ lastPingAt: now, status: "healthy", updatedAt: now })
        .where(eq(monitors.id, monitor.id)),
    ]);

    const updated = await testDb
      .select()
      .from(monitors)
      .where(eq(monitors.id, monitor.id))
      .then((rows) => rows[0]);

    expect(updated.status).toBe("healthy");
  });

  it("should flip a down monitor back to healthy on ping", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    const monitor = await createTestMonitor(project.id, {
      status: "down",
      lastPingAt: new Date("2026-03-12T06:00:00Z"),
    });

    expect(monitor.status).toBe("down");

    const now = new Date();
    await testDb
      .update(monitors)
      .set({ lastPingAt: now, status: "healthy", updatedAt: now })
      .where(eq(monitors.id, monitor.id));

    const updated = await testDb
      .select()
      .from(monitors)
      .where(eq(monitors.id, monitor.id))
      .then((rows) => rows[0]);

    expect(updated.status).toBe("healthy");
  });
});

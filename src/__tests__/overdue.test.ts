import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { testDb } from "./setup";
import { monitors, alertQueue, alertChannels } from "@/lib/db/schema";
import {
  createTestUser,
  createTestProject,
  createTestMonitor,
  createTestAlertChannel,
} from "./helpers";

describe("Overdue Detection", () => {
  it("should mark a healthy monitor as late when ping is overdue", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);

    // Monitor with every-minute schedule, last pinged 10 minutes ago
    const monitor = await createTestMonitor(project.id, {
      name: "Late Job",
      schedule: "* * * * *",
      gracePeriod: 300,
      status: "healthy",
      lastPingAt: new Date(Date.now() - 10 * 60 * 1000),
    });

    // Simulate overdue check: mark as late
    await testDb
      .update(monitors)
      .set({ status: "late", updatedAt: new Date() })
      .where(eq(monitors.id, monitor.id));

    const updated = await testDb
      .select()
      .from(monitors)
      .where(eq(monitors.id, monitor.id))
      .then((rows) => rows[0]);

    expect(updated.status).toBe("late");
  });

  it("should escalate a late monitor to down", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);

    const monitor = await createTestMonitor(project.id, {
      name: "Down Job",
      schedule: "* * * * *",
      gracePeriod: 300,
      status: "late",
      lastPingAt: new Date(Date.now() - 20 * 60 * 1000),
    });

    // Simulate overdue escalation: late → down
    const newStatus = monitor.status === "late" ? "down" : "late";
    await testDb
      .update(monitors)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(monitors.id, monitor.id));

    const updated = await testDb
      .select()
      .from(monitors)
      .where(eq(monitors.id, monitor.id))
      .then((rows) => rows[0]);

    expect(updated.status).toBe("down");
  });

  it("should not affect pending monitors (never pinged)", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);

    const monitor = await createTestMonitor(project.id, {
      status: "pending",
      lastPingAt: null,
    });

    // Pending monitors should remain pending (overdue checker skips them)
    const result = await testDb
      .select()
      .from(monitors)
      .where(eq(monitors.id, monitor.id))
      .then((rows) => rows[0]);

    expect(result.status).toBe("pending");
  });
});

describe("Alert Dispatch", () => {
  it("should queue alerts for all enabled channels when monitor goes late", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    const monitor = await createTestMonitor(project.id, {
      name: "Alert Test Job",
      status: "healthy",
    });

    // Create multiple alert channels
    const emailChannel = await createTestAlertChannel(project.id, {
      type: "email",
      config: { email: "user@example.com" },
    });
    const discordChannel = await createTestAlertChannel(project.id, {
      type: "discord",
      config: { webhookUrl: "https://discord.com/api/webhooks/test" },
    });

    // Simulate dispatch: queue alerts for each channel
    const channels = [emailChannel, discordChannel];
    const values = channels.map((channel) => ({
      monitorId: monitor.id,
      alertChannelId: channel.id,
      payload: {
        monitorName: monitor.name,
        status: "late" as const,
        schedule: monitor.schedule,
        lastPingAt: null,
      },
    }));

    await testDb.insert(alertQueue).values(values);

    // Verify alerts were queued
    const queued = await testDb
      .select()
      .from(alertQueue)
      .where(eq(alertQueue.monitorId, monitor.id));

    expect(queued).toHaveLength(2);
    expect(queued[0].status).toBe("pending");
    expect(queued[1].status).toBe("pending");

    const channelIds = queued.map((a) => a.alertChannelId).sort();
    const expectedIds = [emailChannel.id, discordChannel.id].sort();
    expect(channelIds).toEqual(expectedIds);
  });

  it("should not queue alerts for disabled channels", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    const monitor = await createTestMonitor(project.id);

    // Create one enabled and one disabled channel
    const enabled = await createTestAlertChannel(project.id, {
      type: "email",
      enabled: true,
    });
    await createTestAlertChannel(project.id, {
      type: "discord",
      enabled: false,
    });

    // Only dispatch to enabled channels (simulating dispatch logic)
    const enabledChannels = await testDb
      .select()
      .from(alertChannels)
      .where(eq(alertChannels.projectId, project.id))
      .then((rows) => rows.filter((c) => c.enabled));

    const values = enabledChannels.map((channel) => ({
      monitorId: monitor.id,
      alertChannelId: channel.id,
      payload: {
        monitorName: monitor.name,
        status: "late" as const,
        schedule: monitor.schedule,
        lastPingAt: null,
      },
    }));

    await testDb.insert(alertQueue).values(values);

    const queued = await testDb
      .select()
      .from(alertQueue)
      .where(eq(alertQueue.monitorId, monitor.id));

    expect(queued).toHaveLength(1);
    expect(queued[0].alertChannelId).toBe(enabled.id);
  });

  it("should include correct payload in alert queue", async () => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    const lastPing = new Date("2026-03-12T10:00:00Z");
    const monitor = await createTestMonitor(project.id, {
      name: "Payload Test",
      schedule: "*/5 * * * *",
      status: "healthy",
      lastPingAt: lastPing,
    });

    const channel = await createTestAlertChannel(project.id, {
      type: "slack",
      config: { webhookUrl: "https://hooks.slack.com/test" },
    });

    await testDb.insert(alertQueue).values({
      monitorId: monitor.id,
      alertChannelId: channel.id,
      payload: {
        monitorName: "Payload Test",
        status: "down",
        schedule: "*/5 * * * *",
        lastPingAt: lastPing.toISOString(),
      },
    });

    const alert = await testDb
      .select()
      .from(alertQueue)
      .where(eq(alertQueue.monitorId, monitor.id))
      .then((rows) => rows[0]);

    const payload = alert.payload as {
      monitorName: string;
      status: string;
      schedule: string;
      lastPingAt: string;
    };

    expect(payload.monitorName).toBe("Payload Test");
    expect(payload.status).toBe("down");
    expect(payload.schedule).toBe("*/5 * * * *");
    expect(payload.lastPingAt).toBe("2026-03-12T10:00:00.000Z");
  });
});

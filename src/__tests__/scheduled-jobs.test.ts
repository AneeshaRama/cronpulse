import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseExpression } from "cron-parser";

// Replicate the validation schema from the API route
const createScheduledJobSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  schedule: z.string().min(1, "Schedule is required"),
  type: z.enum(["http", "reminder"]).default("http"),
  httpUrl: z.string().url("Invalid URL").optional(),
  httpMethod: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
  httpHeaders: z.record(z.string(), z.string()).optional(),
  httpBody: z.string().optional(),
  timeoutMs: z.number().int().min(1000).max(60000).default(30000),
});

const updateScheduledJobSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  schedule: z.string().min(1).optional(),
  type: z.enum(["http", "reminder"]).optional(),
  httpUrl: z.string().url("Invalid URL").optional(),
  httpMethod: z.enum(["GET", "POST", "PUT", "DELETE"]).optional(),
  httpHeaders: z.record(z.string(), z.string()).optional(),
  httpBody: z.string().optional(),
  timeoutMs: z.number().int().min(1000).max(60000).optional(),
  status: z.enum(["active", "paused"]).optional(),
});

describe("Scheduled Jobs - Validation", () => {
  it("should validate a valid HTTP job", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "Daily Report",
      schedule: "0 0 * * *",
      type: "http",
      httpUrl: "https://api.example.com/report",
      httpMethod: "POST",
      timeoutMs: 10000,
    });
    expect(result.success).toBe(true);
  });

  it("should validate a valid reminder job", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "Standup Reminder",
      schedule: "0 9 * * 1-5",
      type: "reminder",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "",
      schedule: "0 0 * * *",
    });
    expect(result.success).toBe(false);
  });

  it("should reject name longer than 100 characters", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "a".repeat(101),
      schedule: "0 0 * * *",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty schedule", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "Test",
      schedule: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid URL", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "Test",
      schedule: "0 0 * * *",
      httpUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid HTTP method", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "Test",
      schedule: "0 0 * * *",
      httpMethod: "PATCH",
    });
    expect(result.success).toBe(false);
  });

  it("should reject timeout below 1000ms", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "Test",
      schedule: "0 0 * * *",
      timeoutMs: 500,
    });
    expect(result.success).toBe(false);
  });

  it("should reject timeout above 60000ms", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "Test",
      schedule: "0 0 * * *",
      timeoutMs: 120000,
    });
    expect(result.success).toBe(false);
  });

  it("should default type to http", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "Test",
      schedule: "0 0 * * *",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("http");
    }
  });

  it("should default httpMethod to GET", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "Test",
      schedule: "0 0 * * *",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.httpMethod).toBe("GET");
    }
  });

  it("should default timeoutMs to 30000", () => {
    const result = createScheduledJobSchema.safeParse({
      projectId: "proj_123",
      name: "Test",
      schedule: "0 0 * * *",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeoutMs).toBe(30000);
    }
  });
});

describe("Scheduled Jobs - Update Validation", () => {
  it("should allow partial updates", () => {
    const result = updateScheduledJobSchema.safeParse({
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("should allow status change to paused", () => {
    const result = updateScheduledJobSchema.safeParse({
      status: "paused",
    });
    expect(result.success).toBe(true);
  });

  it("should allow status change to active", () => {
    const result = updateScheduledJobSchema.safeParse({
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid status", () => {
    const result = updateScheduledJobSchema.safeParse({
      status: "disabled",
    });
    expect(result.success).toBe(false);
  });

  it("should allow empty update (no fields)", () => {
    const result = updateScheduledJobSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("Scheduled Jobs - nextRunAt Computation", () => {
  it("should compute next run for every-minute schedule", () => {
    const now = new Date();
    const interval = parseExpression("* * * * *", {
      currentDate: now,
      tz: "UTC",
    });
    const nextRun = interval.next().toDate();

    expect(nextRun.getTime()).toBeGreaterThan(now.getTime());
    // Should be within 60 seconds
    expect(nextRun.getTime() - now.getTime()).toBeLessThanOrEqual(60000);
  });

  it("should compute next run for daily schedule", () => {
    const now = new Date();
    const interval = parseExpression("0 0 * * *", {
      currentDate: now,
      tz: "UTC",
    });
    const nextRun = interval.next().toDate();

    expect(nextRun.getTime()).toBeGreaterThan(now.getTime());
    // Should be within 24 hours
    expect(nextRun.getTime() - now.getTime()).toBeLessThanOrEqual(
      24 * 60 * 60 * 1000,
    );
  });

  it("should throw for invalid cron expression", () => {
    expect(() => {
      parseExpression("invalid-cron");
    }).toThrow();
  });

  it("should handle weekday-only schedules", () => {
    const now = new Date();
    const interval = parseExpression("0 9 * * 1-5", {
      currentDate: now,
      tz: "UTC",
    });
    const nextRun = interval.next().toDate();

    expect(nextRun.getTime()).toBeGreaterThan(now.getTime());
    // Next run should be on a weekday (1=Mon to 5=Fri)
    const day = nextRun.getUTCDay();
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(5);
  });

  it("should recompute nextRunAt after current time advances", () => {
    const now = new Date();
    const interval1 = parseExpression("* * * * *", {
      currentDate: now,
      tz: "UTC",
    });
    const firstNext = interval1.next().toDate();

    const interval2 = parseExpression("* * * * *", {
      currentDate: firstNext,
      tz: "UTC",
    });
    const secondNext = interval2.next().toDate();

    expect(secondNext.getTime()).toBeGreaterThan(firstNext.getTime());
  });
});

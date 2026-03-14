import { describe, it, expect } from "vitest";
import { detectOverlaps } from "@/lib/monitor/detect-overlaps";

describe("Overlap Detection", () => {
  it("should return no overlaps for a single monitor", () => {
    const result = detectOverlaps([
      { id: "1", name: "Job A", schedule: "* * * * *" },
    ]);
    expect(result).toEqual([]);
  });

  it("should return no overlaps for an empty list", () => {
    const result = detectOverlaps([]);
    expect(result).toEqual([]);
  });

  it("should detect overlap between identical schedules", () => {
    const result = detectOverlaps([
      { id: "1", name: "Job A", schedule: "0 0 * * *" },
      { id: "2", name: "Job B", schedule: "0 0 * * *" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].monitorA.name).toBe("Job A");
    expect(result[0].monitorB.name).toBe("Job B");
    expect(result[0].overlapCount).toBeGreaterThanOrEqual(1);
  });

  it("should detect no overlap for completely disjoint schedules", () => {
    // Monday at 9am vs Wednesday at 9am
    const result = detectOverlaps([
      { id: "1", name: "Monday Job", schedule: "0 9 * * 1" },
      { id: "2", name: "Wednesday Job", schedule: "0 9 * * 3" },
    ]);
    expect(result).toEqual([]);
  });

  it("should detect partial overlap", () => {
    // Every 5 minutes vs every 15 minutes (overlap every 15 min)
    const result = detectOverlaps([
      { id: "1", name: "Frequent", schedule: "*/5 * * * *" },
      { id: "2", name: "Less Frequent", schedule: "*/15 * * * *" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].overlapCount).toBeGreaterThan(0);
  });

  it("should handle invalid cron expressions gracefully", () => {
    const result = detectOverlaps([
      { id: "1", name: "Valid", schedule: "0 0 * * *" },
      { id: "2", name: "Invalid", schedule: "not-a-cron" },
    ]);
    expect(result).toEqual([]);
  });

  it("should detect overlaps across multiple monitors", () => {
    const result = detectOverlaps([
      { id: "1", name: "Job A", schedule: "0 0 * * *" },
      { id: "2", name: "Job B", schedule: "0 0 * * *" },
      { id: "3", name: "Job C", schedule: "0 0 * * *" },
    ]);
    // A-B, A-C, B-C = 3 pairs
    expect(result).toHaveLength(3);
  });

  it("should include example times in warnings", () => {
    const result = detectOverlaps([
      { id: "1", name: "Job A", schedule: "0 0 * * *" },
      { id: "2", name: "Job B", schedule: "0 0 * * *" },
    ]);
    expect(result[0].exampleTimes.length).toBeGreaterThanOrEqual(1);
  });
});

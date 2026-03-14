import { parseExpression } from "cron-parser";

interface MonitorInput {
  id: string;
  name: string;
  schedule: string;
}

export interface OverlapWarning {
  monitorA: { id: string; name: string; schedule: string };
  monitorB: { id: string; name: string; schedule: string };
  overlapCount: number;
  exampleTimes: string[];
}

/**
 * Detects schedule overlaps between monitors by comparing
 * their next 24 hours of run times at minute-level precision.
 */
export function detectOverlaps(monitors: MonitorInput[]): OverlapWarning[] {
  if (monitors.length < 2) return [];

  const now = new Date();
  const warnings: OverlapWarning[] = [];

  // Generate run times for each monitor (next 24 hours)
  const runTimesMap = new Map<string, Set<string>>();

  for (const monitor of monitors) {
    try {
      const times = new Set<string>();
      const interval = parseExpression(monitor.schedule, {
        currentDate: now,
        tz: "UTC",
      });

      // Generate up to 1440 run times (one per minute in 24h)
      for (let i = 0; i < 1440; i++) {
        const next = interval.next().toDate();
        if (next.getTime() - now.getTime() > 24 * 60 * 60 * 1000) break;
        // Minute-precision key
        times.add(
          `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}T${String(next.getUTCHours()).padStart(2, "0")}:${String(next.getUTCMinutes()).padStart(2, "0")}`,
        );
      }

      runTimesMap.set(monitor.id, times);
    } catch {
      // Skip monitors with invalid cron expressions
      continue;
    }
  }

  // Compare every pair
  for (let i = 0; i < monitors.length; i++) {
    for (let j = i + 1; j < monitors.length; j++) {
      const timesA = runTimesMap.get(monitors[i].id);
      const timesB = runTimesMap.get(monitors[j].id);

      if (!timesA || !timesB) continue;

      const overlapping: string[] = [];
      for (const time of timesA) {
        if (timesB.has(time)) {
          overlapping.push(time);
        }
      }

      if (overlapping.length > 0) {
        warnings.push({
          monitorA: {
            id: monitors[i].id,
            name: monitors[i].name,
            schedule: monitors[i].schedule,
          },
          monitorB: {
            id: monitors[j].id,
            name: monitors[j].name,
            schedule: monitors[j].schedule,
          },
          overlapCount: overlapping.length,
          exampleTimes: overlapping.slice(0, 2),
        });
      }
    }
  }

  return warnings.sort((a, b) => b.overlapCount - a.overlapCount);
}

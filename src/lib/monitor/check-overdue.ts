import { db } from "@/lib/db";
import { monitors } from "@/lib/db/schema";
import { eq, ne } from "drizzle-orm";
import { parseExpression } from "cron-parser";

export async function checkOverdueMonitors() {
  // Get all monitors that aren't pending (pending = never pinged, nothing to check)
  const activeMonitors = await db
    .select()
    .from(monitors)
    .where(ne(monitors.status, "pending"));

  const now = new Date();

  for (const monitor of activeMonitors) {
    try {
      const interval = parseExpression(monitor.schedule, {
        currentDate: now,
        tz: "UTC",
      });

      // Get the two most recent scheduled runs
      // We skip the most recent one because it may still be in its grace window
      const mostRecentRun = interval.prev().toDate();
      const secondMostRecentRun = interval.prev().toDate();

      // Deadline = second most recent run + grace period
      const deadline = new Date(
        secondMostRecentRun.getTime() + monitor.gracePeriod * 1000,
      );

      // If we're past the deadline and no ping since the second most recent run
      if (now > deadline) {
        const lastPing = monitor.lastPingAt;
        const missedPing = !lastPing || lastPing < secondMostRecentRun;

        if (missedPing) {
          // Determine new status: late → down (escalation)
          const newStatus = monitor.status === "late" ? "down" : "late";

          await db
            .update(monitors)
            .set({
              status: newStatus,
              updatedAt: now,
            })
            .where(eq(monitors.id, monitor.id));

          console.log(
            `[overdue-checker] Monitor "${monitor.name}" (${monitor.id}) marked as ${newStatus}`,
          );
        }
      }
    } catch (error) {
      console.error(
        `[overdue-checker] Error checking monitor "${monitor.name}" (${monitor.id}):`,
        error,
      );
    }
  }
}

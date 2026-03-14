import cron from "node-cron";
import { checkOverdueMonitors } from "@/lib/monitor/check-overdue";
import { processAlertQueue } from "@/lib/alerts/process";
import { executeScheduledJobs } from "@/lib/scheduler/execute";

let initialized = false;

export function startCronJobs() {
  if (initialized) return;
  initialized = true;

  // Check for overdue monitors every minute
  cron.schedule("* * * * *", async () => {
    try {
      await checkOverdueMonitors();
    } catch (error) {
      console.error("[cron] Error checking overdue monitors:", error);
    }
  });

  // Process alert queue every minute
  cron.schedule("* * * * *", async () => {
    try {
      await processAlertQueue();
    } catch (error) {
      console.error("[cron] Error processing alert queue:", error);
    }
  });

  // Execute scheduled jobs every minute
  cron.schedule("* * * * *", async () => {
    try {
      await executeScheduledJobs();
    } catch (error) {
      console.error("[cron] Error executing scheduled jobs:", error);
    }
  });

  console.log("[cron] Background jobs started — checking every minute");
}

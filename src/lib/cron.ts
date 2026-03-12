import cron from "node-cron";
import { checkOverdueMonitors } from "@/lib/monitor/check-overdue";
import { processAlertQueue } from "@/lib/alerts/process";

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

  console.log("[cron] Background jobs started — checking every minute");
}

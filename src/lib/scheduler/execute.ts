import { db } from "@/lib/db";
import { scheduledJobs, scheduledRuns, alertChannels } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { parseExpression } from "cron-parser";

export async function executeScheduledJobs() {
  const now = new Date();

  // Find all active jobs that are due
  const dueJobs = await db
    .select()
    .from(scheduledJobs)
    .where(
      and(
        eq(scheduledJobs.status, "active"),
        lte(scheduledJobs.nextRunAt, now),
      ),
    );

  for (const job of dueJobs) {
    const startedAt = new Date();

    try {
      if (job.type === "http" && job.httpUrl) {
        await executeHttpJob(job, startedAt);
      } else if (job.type === "reminder") {
        await executeReminderJob(job, startedAt);
      }
    } catch (error) {
      console.error(
        `[scheduler] Unexpected error executing job "${job.name}" (${job.id}):`,
        error,
      );
    }

    // Update lastRunAt and compute nextRunAt regardless of success/failure
    try {
      const interval = parseExpression(job.schedule, {
        currentDate: new Date(),
        tz: "UTC",
      });
      const nextRunAt = interval.next().toDate();

      await db
        .update(scheduledJobs)
        .set({
          lastRunAt: startedAt,
          nextRunAt,
          updatedAt: new Date(),
        })
        .where(eq(scheduledJobs.id, job.id));
    } catch (error) {
      console.error(
        `[scheduler] Error updating nextRunAt for job "${job.name}" (${job.id}):`,
        error,
      );
    }
  }
}

async function executeHttpJob(
  job: typeof scheduledJobs.$inferSelect,
  startedAt: Date,
) {
  let status: "success" | "failed" | "timeout" = "failed";
  let responseCode: number | null = null;
  let responseTimeMs: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;

  try {
    const headers: Record<string, string> = (job.httpHeaders as Record<string, string>) ?? {};
    const fetchOptions: RequestInit = {
      method: job.httpMethod,
      headers,
      signal: AbortSignal.timeout(job.timeoutMs),
    };

    if ((job.httpMethod === "POST" || job.httpMethod === "PUT") && job.httpBody) {
      fetchOptions.body = job.httpBody;
    }

    const response = await fetch(job.httpUrl!, fetchOptions);
    const completedAt = new Date();

    responseCode = response.status;
    responseTimeMs = completedAt.getTime() - startedAt.getTime();

    // Capture first 1KB of response body
    const text = await response.text();
    responseBody = text.slice(0, 1024);

    status = response.ok ? "success" : "failed";
    if (!response.ok) {
      errorMessage = `HTTP ${response.status} ${response.statusText}`;
    }

    await db.insert(scheduledRuns).values({
      jobId: job.id,
      status,
      responseCode,
      responseTimeMs,
      responseBody,
      errorMessage,
      startedAt,
      completedAt,
    });

    console.log(
      `[scheduler] Job "${job.name}" (${job.id}) completed: ${status} ${responseCode} in ${responseTimeMs}ms`,
    );
  } catch (error) {
    const completedAt = new Date();
    responseTimeMs = completedAt.getTime() - startedAt.getTime();

    if (error instanceof DOMException && error.name === "TimeoutError") {
      status = "timeout";
      errorMessage = `Request timed out after ${job.timeoutMs}ms`;
    } else {
      status = "failed";
      errorMessage = error instanceof Error ? error.message : "Unknown error";
    }

    await db.insert(scheduledRuns).values({
      jobId: job.id,
      status,
      responseCode,
      responseTimeMs,
      responseBody,
      errorMessage,
      startedAt,
      completedAt,
    });

    console.log(
      `[scheduler] Job "${job.name}" (${job.id}) ${status}: ${errorMessage}`,
    );
  }
}

async function executeReminderJob(
  job: typeof scheduledJobs.$inferSelect,
  startedAt: Date,
) {
  let errorMessage: string | null = null;

  try {
    // Find all enabled alert channels for this project
    const channels = await db
      .select()
      .from(alertChannels)
      .where(
        and(
          eq(alertChannels.projectId, job.projectId),
          eq(alertChannels.enabled, true),
        ),
      );

    let sent = 0;

    for (const channel of channels) {
      try {
        await sendReminderNotification(channel, job.name, job.schedule);
        sent++;
      } catch (err) {
        console.error(
          `[scheduler] Failed to send ${channel.type} reminder for "${job.name}":`,
          err,
        );
      }
    }

    console.log(
      `[scheduler] Reminder "${job.name}" (${job.id}) sent to ${sent}/${channels.length} channel(s)`,
    );
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `[scheduler] Reminder "${job.name}" (${job.id}) failed:`,
      err,
    );
  }

  const completedAt = new Date();

  await db.insert(scheduledRuns).values({
    jobId: job.id,
    status: errorMessage ? "failed" : "success",
    responseCode: null,
    responseTimeMs: completedAt.getTime() - startedAt.getTime(),
    responseBody: null,
    errorMessage,
    startedAt,
    completedAt,
  });
}

async function sendReminderNotification(
  channel: typeof alertChannels.$inferSelect,
  jobName: string,
  schedule: string,
) {
  switch (channel.type) {
    case "discord": {
      const config = channel.config as { webhookUrl: string };
      await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: `:bell: Reminder: ${jobName}`,
              color: 0x6366f1,
              fields: [
                { name: "Schedule", value: `\`${schedule}\``, inline: true },
              ],
              footer: {
                text: "CronPulse — the open source platform for cron jobs",
              },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      break;
    }
    case "slack": {
      const config = channel.config as { webhookUrl: string };
      await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `:bell: *Reminder: ${jobName}*\nSchedule: \`${schedule}\``,
        }),
      });
      break;
    }
    case "telegram": {
      const config = channel.config as { botToken: string; chatId: string };
      await fetch(
        `https://api.telegram.org/bot${config.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: config.chatId,
            text: `🔔 Reminder: ${jobName}\nSchedule: ${schedule}`,
            parse_mode: "HTML",
          }),
        },
      );
      break;
    }
    case "email": {
      // Email reminders would use Resend — skip if not configured
      console.log(
        `[scheduler] Email reminder for "${jobName}" skipped (not implemented for reminders yet)`,
      );
      break;
    }
    case "webhook": {
      const config = channel.config as { url: string };
      await fetch(config.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "reminder.triggered",
          job: { name: jobName, schedule },
          timestamp: new Date().toISOString(),
        }),
      });
      break;
    }
  }
}

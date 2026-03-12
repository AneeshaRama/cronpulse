import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alertQueue, alertChannels } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { sendAlertEmail } from "@/lib/alerts/email";
import { sendDiscordAlert } from "@/lib/alerts/discord";
import { sendSlackAlert } from "@/lib/alerts/slack";
import { sendTelegramAlert } from "@/lib/alerts/telegram";
import { sendWebhookAlert } from "@/lib/alerts/webhook";

const MAX_ATTEMPTS = 3;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pick up pending alerts that haven't exceeded max attempts
  const pendingAlerts = await db
    .select({
      alert: alertQueue,
      channel: alertChannels,
    })
    .from(alertQueue)
    .innerJoin(alertChannels, eq(alertQueue.alertChannelId, alertChannels.id))
    .where(
      and(
        eq(alertQueue.status, "pending"),
        lt(alertQueue.attempts, MAX_ATTEMPTS),
      ),
    );

  let sent = 0;
  let failed = 0;

  for (const { alert, channel } of pendingAlerts) {
    const now = new Date();
    const payload = alert.payload as {
      monitorName: string;
      status: "late" | "down";
      schedule: string;
      lastPingAt: string | null;
    };

    const lastPingAt = payload.lastPingAt
      ? new Date(payload.lastPingAt)
      : null;

    try {
      switch (channel.type) {
        case "email": {
          const config = channel.config as { email: string };
          await sendAlertEmail({
            to: config.email,
            monitorName: payload.monitorName,
            status: payload.status,
            schedule: payload.schedule,
            lastPingAt,
          });
          break;
        }
        case "discord": {
          const config = channel.config as { webhookUrl: string };
          await sendDiscordAlert({
            webhookUrl: config.webhookUrl,
            monitorName: payload.monitorName,
            status: payload.status,
            schedule: payload.schedule,
            lastPingAt,
          });
          break;
        }
        case "slack": {
          const config = channel.config as { webhookUrl: string };
          await sendSlackAlert({
            webhookUrl: config.webhookUrl,
            monitorName: payload.monitorName,
            status: payload.status,
            schedule: payload.schedule,
            lastPingAt,
          });
          break;
        }
        case "telegram": {
          const config = channel.config as { botToken: string; chatId: string };
          await sendTelegramAlert({
            botToken: config.botToken,
            chatId: config.chatId,
            monitorName: payload.monitorName,
            status: payload.status,
            schedule: payload.schedule,
            lastPingAt,
          });
          break;
        }
        case "webhook": {
          const config = channel.config as { url: string };
          await sendWebhookAlert({
            url: config.url,
            monitorName: payload.monitorName,
            status: payload.status,
            schedule: payload.schedule,
            lastPingAt,
          });
          break;
        }
      }

      // Mark as sent
      await db
        .update(alertQueue)
        .set({
          status: "sent",
          attempts: alert.attempts + 1,
          lastAttemptedAt: now,
          sentAt: now,
        })
        .where(eq(alertQueue.id, alert.id));

      sent++;
    } catch (error) {
      const newAttempts = alert.attempts + 1;

      // Mark as failed if max attempts reached, otherwise stay pending for retry
      await db
        .update(alertQueue)
        .set({
          status: newAttempts >= MAX_ATTEMPTS ? "failed" : "pending",
          attempts: newAttempts,
          lastAttemptedAt: now,
        })
        .where(eq(alertQueue.id, alert.id));

      console.error(
        `[process-alerts] Failed to send ${channel.type} alert ${alert.id} (attempt ${newAttempts}/${MAX_ATTEMPTS}):`,
        error,
      );

      failed++;
    }
  }

  return NextResponse.json({
    status: "ok",
    processed: pendingAlerts.length,
    sent,
    failed,
  });
}

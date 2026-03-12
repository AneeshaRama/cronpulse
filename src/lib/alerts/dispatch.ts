import { db } from "@/lib/db";
import { alertChannels, alertQueue, monitors } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface DispatchParams {
  monitorId: string;
  projectId: string;
  monitorName: string;
  status: "late" | "down";
  schedule: string;
  lastPingAt: Date | null;
}

export async function dispatchAlerts({
  monitorId,
  projectId,
  monitorName,
  status,
  schedule,
  lastPingAt,
}: DispatchParams) {
  // Find all enabled alert channels for this project
  const channels = await db
    .select()
    .from(alertChannels)
    .where(
      and(
        eq(alertChannels.projectId, projectId),
        eq(alertChannels.enabled, true),
      ),
    );

  if (channels.length === 0) {
    return;
  }

  // Queue an alert for each channel
  const values = channels.map((channel) => ({
    monitorId,
    alertChannelId: channel.id,
    payload: {
      monitorName,
      status,
      schedule,
      lastPingAt: lastPingAt?.toISOString() ?? null,
    },
  }));

  await db.insert(alertQueue).values(values);

  console.log(
    `[alert-dispatch] Queued ${values.length} alert(s) for monitor "${monitorName}" (${status})`,
  );
}

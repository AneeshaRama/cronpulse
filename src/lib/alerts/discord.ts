interface DiscordAlertParams {
  webhookUrl: string;
  monitorName: string;
  status: "late" | "down";
  schedule: string;
  lastPingAt: Date | null;
}

export async function sendDiscordAlert({
  webhookUrl,
  monitorName,
  status,
  schedule,
  lastPingAt,
}: DiscordAlertParams) {
  const isDown = status === "down";
  const color = isDown ? 0xef4444 : 0xf59e0b; // red : yellow
  const statusLabel = isDown ? "Down" : "Late";
  const emoji = isDown ? ":rotating_light:" : ":warning:";

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: `${emoji} ${monitorName} is ${statusLabel}`,
          color,
          fields: [
            { name: "Status", value: statusLabel, inline: true },
            { name: "Schedule", value: `\`${schedule}\``, inline: true },
            {
              name: "Last Ping",
              value: lastPingAt ? lastPingAt.toUTCString() : "Never",
              inline: true,
            },
          ],
          footer: { text: "CronPulse — the open source platform for cron jobs" },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Discord webhook failed (${res.status}): ${text}`);
  }
}

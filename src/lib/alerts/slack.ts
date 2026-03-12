interface SlackAlertParams {
  webhookUrl: string;
  monitorName: string;
  status: "late" | "down";
  schedule: string;
  lastPingAt: Date | null;
}

export async function sendSlackAlert({
  webhookUrl,
  monitorName,
  status,
  schedule,
  lastPingAt,
}: SlackAlertParams) {
  const isDown = status === "down";
  const statusLabel = isDown ? "Down" : "Late";
  const emoji = isDown ? ":rotating_light:" : ":warning:";
  const color = isDown ? "#ef4444" : "#f59e0b";

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attachments: [
        {
          color,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${emoji} *${monitorName}* is *${statusLabel}*`,
              },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Status:*\n${statusLabel}` },
                { type: "mrkdwn", text: `*Schedule:*\n\`${schedule}\`` },
                {
                  type: "mrkdwn",
                  text: `*Last Ping:*\n${lastPingAt ? lastPingAt.toUTCString() : "Never"}`,
                },
              ],
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: "Sent by *CronPulse* — the open source platform for cron jobs",
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Slack webhook failed (${res.status}): ${text}`);
  }
}

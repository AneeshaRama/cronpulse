interface WebhookAlertParams {
  url: string;
  monitorName: string;
  status: "late" | "down";
  schedule: string;
  lastPingAt: Date | null;
}

export async function sendWebhookAlert({
  url,
  monitorName,
  status,
  schedule,
  lastPingAt,
}: WebhookAlertParams) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "monitor.status_changed",
      monitor: {
        name: monitorName,
        status,
        schedule,
        lastPingAt: lastPingAt?.toISOString() ?? null,
      },
      timestamp: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Webhook failed (${res.status}): ${text}`);
  }
}

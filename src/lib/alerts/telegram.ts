interface TelegramAlertParams {
  botToken: string;
  chatId: string;
  monitorName: string;
  status: "late" | "down";
  schedule: string;
  lastPingAt: Date | null;
}

export async function sendTelegramAlert({
  botToken,
  chatId,
  monitorName,
  status,
  schedule,
  lastPingAt,
}: TelegramAlertParams) {
  const isDown = status === "down";
  const statusLabel = isDown ? "Down" : "Late";
  const emoji = isDown ? "\ud83d\udea8" : "\u26a0\ufe0f";

  const text = [
    `${emoji} <b>${monitorName}</b> is <b>${statusLabel}</b>`,
    "",
    `<b>Status:</b> ${statusLabel}`,
    `<b>Schedule:</b> <code>${schedule}</code>`,
    `<b>Last Ping:</b> ${lastPingAt ? lastPingAt.toUTCString() : "Never"}`,
    "",
    "<i>Sent by CronPulse</i>",
  ].join("\n");

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({ description: "Unknown error" }));
    throw new Error(
      `Telegram API failed (${res.status}): ${data.description || "Unknown error"}`,
    );
  }
}

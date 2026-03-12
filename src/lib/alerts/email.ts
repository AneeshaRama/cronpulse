import { Resend } from "resend";

let resend: Resend;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM_EMAIL = "CronPulse <onboarding@resend.dev>";

interface AlertEmailParams {
  to: string;
  monitorName: string;
  status: "late" | "down";
  schedule: string;
  lastPingAt: Date | null;
}

export async function sendAlertEmail({
  to,
  monitorName,
  status,
  schedule,
  lastPingAt,
}: AlertEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[alerts] Email skipped — RESEND_API_KEY not configured");
    return null;
  }

  const statusLabel = status === "late" ? "Late" : "Down";
  const statusEmoji = status === "late" ? "\u26a0\ufe0f" : "\ud83d\udea8";
  const lastPingText = lastPingAt
    ? lastPingAt.toUTCString()
    : "Never";

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${statusEmoji} ${monitorName} is ${statusLabel}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <div style="background: ${status === "late" ? "#fef3c7" : "#fee2e2"}; border: 1px solid ${status === "late" ? "#f59e0b" : "#ef4444"}33; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: ${status === "late" ? "#92400e" : "#991b1b"};">
            ${statusEmoji} Monitor ${statusLabel}
          </p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; color: #111;">
            ${monitorName}
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Status</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 500; color: ${status === "late" ? "#d97706" : "#dc2626"};">${statusLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Schedule</td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace;">${schedule}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Last ping</td>
            <td style="padding: 8px 0; text-align: right;">${lastPingText}</td>
          </tr>
        </table>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Sent by CronPulse — the open source platform for cron jobs.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

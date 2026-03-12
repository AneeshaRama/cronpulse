import { Callout } from "../components";

export default function AlertChannelsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight">Alert Channels</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Configure where CronPulse sends alerts when your monitors go late or
        down.
      </p>

      <div className="mt-10 space-y-10">
        <Section title="Overview">
          <p className="text-sm text-muted-foreground">
            CronPulse supports 5 alert channels. You can enable multiple
            channels at once — alerts will be sent to all enabled channels. Configure
            them from <strong className="text-foreground">Settings</strong> in
            the dashboard.
          </p>
        </Section>

        <Section title="Email">
          <p className="text-sm text-muted-foreground">
            Email alerts use{" "}
            <a
              href="https://resend.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Resend
            </a>
            . A default email channel is created automatically when you sign up.
          </p>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>To set up:</p>
            <ol className="list-inside list-decimal space-y-2">
              <li>Create an account at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com</a></li>
              <li>Get your API key from the Resend dashboard</li>
              <li>Add <code className="rounded bg-card/60 px-1.5 py-0.5">RESEND_API_KEY</code> to your <code className="rounded bg-card/60 px-1.5 py-0.5">.env</code> and restart</li>
            </ol>
          </div>
          <div className="mt-4">
            <Callout type="info">
              <strong className="text-foreground">Note:</strong> If{" "}
              <code className="rounded bg-card/60 px-1.5 py-0.5">RESEND_API_KEY</code>{" "}
              is not set, email alerts are silently skipped. Resend&apos;s free tier only sends
              to the account owner&apos;s email — for other addresses, you need a verified domain.
            </Callout>
          </div>
        </Section>

        <Section title="Discord">
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>In your Discord server, go to <strong className="text-foreground">Server Settings → Integrations → Webhooks</strong></li>
            <li>Click <strong className="text-foreground">New Webhook</strong> and copy the URL</li>
            <li>In CronPulse, go to <strong className="text-foreground">Settings</strong> and add a Discord channel</li>
            <li>Paste the webhook URL</li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            CronPulse sends rich embeds with monitor name, status, schedule, and
            last ping time.
          </p>
        </Section>

        <Section title="Slack">
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">api.slack.com/apps</a> and create a new app</li>
            <li>Enable <strong className="text-foreground">Incoming Webhooks</strong> and add one to your channel</li>
            <li>Copy the webhook URL</li>
            <li>In CronPulse, go to <strong className="text-foreground">Settings</strong> and add a Slack channel</li>
            <li>Paste the webhook URL</li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            Alerts are formatted using Slack Block Kit for a clean, readable
            message.
          </p>
        </Section>

        <Section title="Telegram">
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>
              Message{" "}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @BotFather
              </a>{" "}
              on Telegram
            </li>
            <li>Send <code className="rounded bg-card/60 px-1.5 py-0.5">/newbot</code> and follow the prompts</li>
            <li>Copy the <strong className="text-foreground">bot token</strong></li>
            <li>Add the bot to your group/channel</li>
            <li>
              Send a message in the group, then visit:{" "}
              <code className="rounded bg-card/60 px-1.5 py-0.5 text-xs">
                https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates
              </code>
            </li>
            <li>
              Find the <code className="rounded bg-card/60 px-1.5 py-0.5">chat.id</code> in
              the response
            </li>
            <li>In CronPulse, go to <strong className="text-foreground">Settings</strong> and add a Telegram channel with both the bot token and chat ID</li>
          </ol>
        </Section>

        <Section title="Custom Webhook">
          <p className="text-sm text-muted-foreground">
            Send alerts to any HTTP endpoint. CronPulse sends a POST request
            with this JSON payload:
          </p>
          <div className="mt-4 rounded-lg border border-border/30 bg-[oklch(0.12_0.005_260)] p-4">
            <pre className="overflow-x-auto text-[13px] leading-relaxed">
              <code className="text-foreground/80">
{`{
  "event": "monitor.status_changed",
  "monitor": {
    "name": "My Cron Job",
    "status": "down",
    "schedule": "*/5 * * * *",
    "lastPingAt": "2026-03-12T10:00:00.000Z"
  },
  "timestamp": "2026-03-12T10:10:00.000Z"
}`}
              </code>
            </pre>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Use this to integrate with any service — PagerDuty, Opsgenie,
            custom dashboards, or your own automation.
          </p>
        </Section>

        <Section title="Alert behavior">
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              Alerts are sent to <strong className="text-foreground">all enabled channels</strong> when
              a monitor status changes
            </li>
            <li>
              Two alerts per incident: one when the monitor goes{" "}
              <strong className="text-foreground">late</strong>, another if it
              escalates to <strong className="text-foreground">down</strong>
            </li>
            <li>Failed alerts are retried up to 3 times</li>
            <li>You can enable/disable individual channels from Settings</li>
            <li>
              Full alert history is available in the{" "}
              <strong className="text-foreground">Alerts</strong> tab
            </li>
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

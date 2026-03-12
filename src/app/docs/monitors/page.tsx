import { CodeBlock, Callout } from "../components";

export default function MonitorsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight">Monitors</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Monitors track your cron jobs and alert you when they stop running.
      </p>

      <div className="mt-10 space-y-10">
        <Section title="What is a monitor?">
          <p className="text-sm text-muted-foreground">
            A monitor represents a single cron job you want to track. Each
            monitor has:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Name</strong> — A label to
              identify the job (e.g. &quot;Database backup&quot;)
            </li>
            <li>
              <strong className="text-foreground">Schedule</strong> — A cron
              expression defining when the job should run (e.g.{" "}
              <code className="rounded bg-card/60 px-1.5 py-0.5">0 0 * * *</code>{" "}
              for daily at midnight)
            </li>
            <li>
              <strong className="text-foreground">Grace period</strong> — How
              long to wait (in seconds) after the expected run time before
              marking the job as late. Default: 300 seconds (5 minutes).
            </li>
            <li>
              <strong className="text-foreground">Ping URL</strong> — A unique
              URL that your cron job hits when it runs successfully
            </li>
          </ul>
        </Section>

        <Section title="Monitor statuses">
          <div className="space-y-4">
            <StatusRow
              status="Pending"
              color="bg-muted-foreground"
              description="The monitor was just created and has never received a ping."
            />
            <StatusRow
              status="Healthy"
              color="bg-emerald-400"
              description="The monitor is receiving pings on schedule. Everything is working."
            />
            <StatusRow
              status="Late"
              color="bg-yellow-400"
              description="The expected ping hasn't arrived within the grace period. An alert is sent."
            />
            <StatusRow
              status="Down"
              color="bg-red-400"
              description="The monitor was already late and still hasn't received a ping. A second alert is sent."
            />
          </div>

          <div className="mt-6">
            <Callout type="info">
              <strong className="text-foreground">Status flow:</strong> Pending → Healthy
              → Late → Down. A ping at any point resets the status back to
              Healthy.
            </Callout>
          </div>
        </Section>

        <Section title="Pinging your monitor">
          <p className="text-sm text-muted-foreground">
            After creating a monitor, you get a unique ping URL. Add it to
            your cron script:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`# Bash — add to the end of your cron job
curl -fsS https://<your-cronpulse-url>/ping/<your-ping-id>`}
            />
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            You can also use other languages:
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Python
              </p>
              <CodeBlock
                code={`import requests
requests.get("https://<your-cronpulse-url>/ping/<your-ping-id>")`}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Node.js
              </p>
              <CodeBlock
                code={`fetch("https://<your-cronpulse-url>/ping/<your-ping-id>");`}
              />
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Both <code className="rounded bg-card/60 px-1.5 py-0.5">GET</code>{" "}
            and <code className="rounded bg-card/60 px-1.5 py-0.5">POST</code>{" "}
            requests are supported. No request body is needed.
          </p>
        </Section>

        <Section title="Grace period">
          <p className="text-sm text-muted-foreground">
            The grace period gives your job extra time before CronPulse marks it
            as late. This accounts for jobs that take a while to complete or
            minor delays.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>Minimum: 60 seconds (1 minute)</li>
            <li>Maximum: 86,400 seconds (24 hours)</li>
            <li>Default: 300 seconds (5 minutes)</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            For a job scheduled at <code className="rounded bg-card/60 px-1.5 py-0.5">0 * * * *</code>{" "}
            (every hour) with a 5-minute grace period: if the ping
            doesn&apos;t arrive by :05, the monitor is marked as late.
          </p>
        </Section>

        <Section title="Cron expressions">
          <p className="text-sm text-muted-foreground">
            CronPulse uses standard 5-field cron expressions:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`┌───────── minute (0-59)
│ ┌─────── hour (0-23)
│ │ ┌───── day of month (1-31)
│ │ │ ┌─── month (1-12)
│ │ │ │ ┌─ day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *`}
            />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-left">
                  <th className="pb-3 pr-4 font-semibold">Expression</th>
                  <th className="pb-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-primary">* * * * *</code>
                  </td>
                  <td className="py-2.5">Every minute</td>
                </tr>
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-primary">*/5 * * * *</code>
                  </td>
                  <td className="py-2.5">Every 5 minutes</td>
                </tr>
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-primary">0 * * * *</code>
                  </td>
                  <td className="py-2.5">Every hour</td>
                </tr>
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-primary">0 0 * * *</code>
                  </td>
                  <td className="py-2.5">Every day at midnight</td>
                </tr>
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-primary">0 0 * * 1</code>
                  </td>
                  <td className="py-2.5">Every Monday at midnight</td>
                </tr>
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-primary">0 0 1 * *</code>
                  </td>
                  <td className="py-2.5">First day of every month</td>
                </tr>
              </tbody>
            </table>
          </div>
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

function StatusRow({
  status,
  color,
  description,
}: {
  status: string;
  color: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/20 bg-card/10 p-4">
      <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
      <div>
        <p className="text-sm font-medium">{status}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

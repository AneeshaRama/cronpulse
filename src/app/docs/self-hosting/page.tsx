import { CodeBlock, Callout } from "../components";

export default function SelfHostingPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight">Self-Hosting</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Run CronPulse on your own infrastructure with Docker.
      </p>

      <div className="mt-10 space-y-10">
        <Section title="Requirements">
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>Docker and Docker Compose</li>
            <li>At least 512MB RAM</li>
            <li>PostgreSQL 16+ (included in Docker Compose)</li>
          </ul>
        </Section>

        <Section title="Docker Compose">
          <p className="text-sm text-muted-foreground">
            CronPulse ships with a <code className="rounded bg-card/60 px-1.5 py-0.5 text-primary">docker-compose.yml</code> that
            includes PostgreSQL and the app. Database migrations run
            automatically on startup.
          </p>
          <div className="mt-4">
            <CodeBlock code="docker compose up -d" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The app starts on port <strong className="text-foreground">3000</strong> by
            default.
          </p>
        </Section>

        <Section title="Environment Variables">
          <div className="overflow-x-auto">
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-left">
                  <th className="pb-3 pr-4 font-semibold">Variable</th>
                  <th className="pb-3 pr-4 font-semibold">Required</th>
                  <th className="pb-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <EnvRow name="DATABASE_URL" required desc="PostgreSQL connection string (set automatically by Docker)" />
                <EnvRow name="AUTH_SECRET" required desc="Secret for signing tokens. Generate with: openssl rand -base64 33" />
                <EnvRow name="AUTH_TRUST_HOST" required desc='Set to "true" for Docker deployments' />
                <EnvRow name="AUTH_URL" required desc="Your app's public URL (e.g. http://localhost:3000)" />
                <EnvRow name="CRON_SECRET" required desc="Secret for internal cron endpoints" />
                <EnvRow name="NEXT_PUBLIC_BASE_URL" required desc="Base URL for generating ping URLs" />
                <EnvRow name="AUTH_GITHUB_ID" desc="GitHub OAuth Client ID (optional)" />
                <EnvRow name="AUTH_GITHUB_SECRET" desc="GitHub OAuth Client Secret (optional)" />
                <EnvRow name="RESEND_API_KEY" desc="Resend API key for email alerts (optional)" />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="GitHub OAuth (Optional)">
          <p className="text-sm text-muted-foreground">
            CronPulse supports email/password auth out of the box. To also
            enable GitHub sign-in:
          </p>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>
              Go to{" "}
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub Developer Settings
              </a>
            </li>
            <li>Create a new OAuth App</li>
            <li>
              Set the callback URL to{" "}
              <code className="rounded bg-card/60 px-1.5 py-0.5">
                http://localhost:3000/api/auth/callback/github
              </code>
            </li>
            <li>
              Add <code className="rounded bg-card/60 px-1.5 py-0.5">AUTH_GITHUB_ID</code> and{" "}
              <code className="rounded bg-card/60 px-1.5 py-0.5">AUTH_GITHUB_SECRET</code> to
              your <code className="rounded bg-card/60 px-1.5 py-0.5">.env</code>
            </li>
            <li>Restart the container</li>
          </ol>
        </Section>

        <Section title="Email Alerts (Optional)">
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
            . If <code className="rounded bg-card/60 px-1.5 py-0.5">RESEND_API_KEY</code> is
            not set, email alerts are silently skipped. You can still use
            Discord, Slack, Telegram, or webhooks.
          </p>
          <div className="mt-4">
            <Callout type="info">
              <strong className="text-foreground">Note:</strong> Resend&apos;s free tier
              only sends to the account owner&apos;s email. For sending to other
              addresses, you need a verified domain.
            </Callout>
          </div>
        </Section>

        <Section title="Updating">
          <p className="text-sm text-muted-foreground">
            To update to the latest version:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`git pull origin main
docker compose down
docker compose up -d --build`}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Database migrations are applied automatically on startup.
          </p>
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

function EnvRow({
  name,
  required,
  desc,
}: {
  name: string;
  required?: boolean;
  desc: string;
}) {
  return (
    <tr className="border-b border-border/15">
      <td className="py-3 pr-4">
        <code className="text-xs text-primary">{name}</code>
      </td>
      <td className="py-3 pr-4">
        {required ? (
          <span className="text-xs font-medium text-foreground">Yes</span>
        ) : (
          <span className="text-xs text-muted-foreground/60">No</span>
        )}
      </td>
      <td className="py-3 text-xs">{desc}</td>
    </tr>
  );
}

import { CodeBlock } from "../components";

export default function QuickStartPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight">Quick Start</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Get CronPulse running locally with Docker in under 5 minutes.
      </p>

      <div className="mt-10 space-y-10">
        <Section title="Prerequisites">
          <ul className="list-inside list-disc space-y-2 text-muted-foreground">
            <li>
              <a
                href="https://docs.docker.com/get-docker/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Docker
              </a>{" "}
              and Docker Compose installed
            </li>
            <li>
              (Optional){" "}
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub OAuth app
              </a>{" "}
              for GitHub sign-in
            </li>
          </ul>
        </Section>

        <Section title="1. Clone the repository">
          <CodeBlock
            code={`git clone https://github.com/AneeshaRama/cronpulse.git
cd cronpulse`}
          />
        </Section>

        <Section title="2. Configure environment">
          <CodeBlock code="cp .env.example .env" />
          <p className="mt-4 text-sm text-muted-foreground">
            Open <code className="rounded bg-card/60 px-1.5 py-0.5 text-primary">.env</code> and update the required values:
          </p>
          <CodeBlock
            code={`# Generate a secret (required)
# Run: openssl rand -base64 33
AUTH_SECRET="paste-your-generated-secret-here"

# Generate a cron secret (required)
CRON_SECRET="paste-any-random-string-here"

# Set your base URL (required)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"`}
          />
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Note:</strong> GitHub OAuth and
            email alerts (Resend) are optional. You can sign in with email and
            password immediately.
          </div>
        </Section>

        <Section title="3. Start CronPulse">
          <CodeBlock code="docker compose up -d" />
          <p className="mt-4 text-sm text-muted-foreground">
            That&apos;s it. Open{" "}
            <a
              href="http://localhost:3000"
              className="text-primary hover:underline"
            >
              http://localhost:3000
            </a>{" "}
            and create your account.
          </p>
        </Section>

        <Section title="4. Create your first monitor">
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>Go to the Dashboard and click <strong className="text-foreground">New Monitor</strong></li>
            <li>Enter a name, cron schedule (e.g. <code className="rounded bg-card/60 px-1.5 py-0.5">*/5 * * * *</code>), and grace period</li>
            <li>Copy the generated ping URL</li>
            <li>
              Add it to the end of your cron script:
            </li>
          </ol>
          <CodeBlock
            code={`# Add this to the end of your cron job
curl -fsS https://<your-cronpulse-url>/ping/<your-ping-id>`}
          />
        </Section>

        <Section title="5. Stop CronPulse">
          <CodeBlock code="docker compose down" />
          <p className="mt-3 text-sm text-muted-foreground">
            To also remove the database volume:
          </p>
          <CodeBlock code="docker compose down -v" />
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

import { CodeBlock } from "../components";

export default function IntegrationsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight">Integrations</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Examples of integrating CronPulse pings into your cron jobs across
        different languages and platforms.
      </p>

      <div className="mt-10 space-y-10">
        <Section title="Bash / Shell">
          <p className="text-sm text-muted-foreground">
            The simplest integration. Add a curl to the end of your cron
            script:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`#!/bin/bash
# Your cron job logic here
pg_dump mydb > /backups/mydb.sql

# Ping CronPulse on success
curl -fsS https://<your-cronpulse-url>/ping/<your-ping-id>`}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The <code className="rounded bg-card/60 px-1.5 py-0.5">-fsS</code> flags
            make curl fail silently on errors, show errors on stderr, and
            suppress the progress bar.
          </p>
        </Section>

        <Section title="Python">
          <div className="mt-4">
            <CodeBlock
              code={`import requests

def main():
    # Your job logic here
    process_data()

    # Ping CronPulse on success
    requests.get("https://<your-cronpulse-url>/ping/<your-ping-id>")

if __name__ == "__main__":
    main()`}
            />
          </div>
        </Section>

        <Section title="Node.js">
          <div className="mt-4">
            <CodeBlock
              code={`async function main() {
  // Your job logic here
  await processData();

  // Ping CronPulse on success
  await fetch("https://<your-cronpulse-url>/ping/<your-ping-id>");
}

main();`}
            />
          </div>
        </Section>

        <Section title="Go">
          <div className="mt-4">
            <CodeBlock
              code={`package main

import (
    "net/http"
    "log"
)

func main() {
    // Your job logic here
    processData()

    // Ping CronPulse on success
    _, err := http.Get("https://<your-cronpulse-url>/ping/<your-ping-id>")
    if err != nil {
        log.Printf("Failed to ping CronPulse: %v", err)
    }
}`}
            />
          </div>
        </Section>

        <Section title="Ruby">
          <div className="mt-4">
            <CodeBlock
              code={`require 'net/http'

# Your job logic here
process_data

# Ping CronPulse on success
Net::HTTP.get(URI("https://<your-cronpulse-url>/ping/<your-ping-id>"))`}
            />
          </div>
        </Section>

        <Section title="Rust">
          <div className="mt-4">
            <CodeBlock
              code={`use reqwest;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Your job logic here
    process_data().await?;

    // Ping CronPulse on success
    reqwest::get("https://<your-cronpulse-url>/ping/<your-ping-id>").await?;
    Ok(())
}`}
            />
          </div>
        </Section>

        <Section title="Docker / Kubernetes">
          <p className="text-sm text-muted-foreground">
            For containerized jobs, add the ping to your entrypoint script or
            as the last command in your job spec:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`# Dockerfile entrypoint
#!/bin/sh
python /app/job.py && \\
  curl -fsS https://<your-cronpulse-url>/ping/<your-ping-id>`}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The <code className="rounded bg-card/60 px-1.5 py-0.5">&&</code> ensures
            the ping only fires if the job succeeds.
          </p>
        </Section>

        <Section title="Tips">
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Always ping at the end</strong>{" "}
              — Place the ping after your job logic so it only fires on success
            </li>
            <li>
              <strong className="text-foreground">Use && chaining</strong> — In
              shell scripts, chain with <code className="rounded bg-card/60 px-1.5 py-0.5">&&</code> to
              skip the ping if the job fails
            </li>
            <li>
              <strong className="text-foreground">Both GET and POST work</strong>{" "}
              — No request body needed, either method is fine
            </li>
            <li>
              <strong className="text-foreground">Rate limit</strong> — 1 ping
              per second per monitor. Additional pings within that window return
              429
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

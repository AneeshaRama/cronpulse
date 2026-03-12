import { Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DocsIntroduction() {
  return (
    <div className="max-w-3xl">
      <div className="mb-2 flex items-center gap-2 text-sm text-primary">
        <Activity className="h-4 w-4" />
        <span className="font-medium">Documentation</span>
      </div>

      <h1 className="text-4xl font-bold tracking-tight">
        Welcome to CronPulse
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        CronPulse is an open source platform for monitoring your cron jobs.
        Register your jobs, add a simple ping to your scripts, and get alerted
        on Discord, Slack, Telegram, or email when something goes wrong.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <QuickLink
          href="/docs/quick-start"
          title="Quick Start"
          description="Get up and running in under 5 minutes with Docker."
        />
        <QuickLink
          href="/docs/monitors"
          title="Monitors"
          description="Learn how to create and manage cron job monitors."
        />
        <QuickLink
          href="/docs/alert-channels"
          title="Alert Channels"
          description="Set up notifications on Discord, Slack, Telegram, and more."
        />
        <QuickLink
          href="/docs/api"
          title="API Reference"
          description="Full reference for all CronPulse API endpoints."
        />
      </div>

      <div className="mt-12 rounded-xl border border-border/30 bg-card/20 p-6">
        <h2 className="text-lg font-semibold">How it works</h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              1
            </span>
            <p>
              <strong className="text-foreground">Register your job</strong> —
              Add your cron job to CronPulse with its expected schedule and
              grace period.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              2
            </span>
            <p>
              <strong className="text-foreground">Add a ping</strong> — Append a
              simple HTTP request to your cron script. When it runs
              successfully, it pings CronPulse.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              3
            </span>
            <p>
              <strong className="text-foreground">Get alerted</strong> — If the
              ping doesn&apos;t arrive within the expected window, CronPulse
              marks the job as late or down and sends alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border/30 bg-card/20 p-5 transition-all hover:border-border/50 hover:bg-card/40"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}

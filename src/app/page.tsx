import Link from "next/link";
import {
  Activity,
  Bell,
  Clock,
  Terminal,
  Shield,
  Zap,
  ArrowRight,
  Check,
  Github,
  Monitor,
  Webhook,
  ChevronRight,
} from "lucide-react";
import { SlackIcon, DiscordIcon, TelegramIcon } from "@/components/icons";
import { AnimateIn } from "@/components/hero-animation";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">CronPulse</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              className="flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Docs
            </Link>
            <a
              href="https://github.com/AneeshaRama/cronpulse"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <Link
              href="/dashboard"
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
            >
              Dashboard
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 sm:pt-44 sm:pb-32">
        {/* Glow effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/6 blur-[150px]" />
          <div className="absolute right-0 top-1/4 h-[300px] w-[300px] rounded-full bg-primary/4 blur-[100px]" />
        </div>

        {/* Grid pattern */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <AnimateIn delay={0}>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                <Shield className="h-3.5 w-3.5" />
                Open source & self-hostable
              </div>
            </AnimateIn>

            <AnimateIn delay={150}>
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                The open source
                <br />
                platform for{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  cron jobs
                </span>
              </h1>
            </AnimateIn>

            <AnimateIn delay={300}>
              <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground/80 sm:text-xl sm:leading-relaxed">
                Monitor your existing cron jobs and get alerted
                on <span className="text-foreground/70">Discord</span>, <span className="text-foreground/70">Slack</span>, <span className="text-foreground/70">Telegram</span>, and <span className="text-foreground/70">email</span> when
                something goes wrong.
              </p>
            </AnimateIn>

            <AnimateIn delay={450}>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/dashboard"
                  className="group flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
                >
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="https://github.com/AneeshaRama/cronpulse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center gap-2.5 rounded-xl border border-border/50 bg-card/30 px-7 text-base font-medium transition-all hover:border-border hover:bg-card/60"
                >
                  <Github className="h-4.5 w-4.5" />
                  Star on GitHub
                </a>
              </div>
            </AnimateIn>

            {/* Quick setup snippet */}
            <AnimateIn delay={600}>
              <div className="mx-auto mt-16 inline-flex items-center gap-3 rounded-lg bg-[oklch(0.12_0.005_260)] px-5 py-3 ring-1 ring-white/[0.06]">
                <code className="font-mono text-[13px] tracking-wide sm:text-sm">
                  <span className="text-white/40">{">"}</span>{" "}
                  <span className="text-white/30">{"<"}</span>
                  <span className="text-primary/70">https://your-hosted-url</span>
                  <span className="text-white/30">{">"}</span>
                  <span className="text-primary">/ping/</span>
                  <span className="text-primary/50">abc123</span>
                </code>
                <span className="h-4 w-px bg-white/10" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-white/20">
                  ping url
                </span>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative border-t border-border/20 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary/80">
              Simple setup
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three steps. No SDK. No agent. Just a curl.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <StepCard
              step="1"
              title="Register your job"
              description="Add your cron job to CronPulse. Set the expected schedule and grace period."
              icon={<Clock className="h-5 w-5" />}
            />
            <StepCard
              step="2"
              title="Add a ping"
              description="Append a single curl to your cron script. When it runs, it pings CronPulse."
              icon={<Terminal className="h-5 w-5" />}
            />
            <StepCard
              step="3"
              title="Get alerted"
              description="If the ping doesn't arrive on time, CronPulse alerts you on your preferred channel."
              icon={<Bell className="h-5 w-5" />}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-border/20 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/4 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary/80">
              Features
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built for developers who run cron jobs in production.
            </p>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Monitor className="h-5 w-5" />}
              title="Real-time monitoring"
              description="Track every cron job. See which ones are healthy, late, or down at a glance."
            />
            <FeatureCard
              icon={<Bell className="h-5 w-5" />}
              title="Multi-channel alerts"
              description="Get notified via email, Discord, Slack, Telegram, or custom webhooks."
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="Zero config"
              description="No SDK. No agent. Just add a curl to the end of your script."
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5" />}
              title="Self-hostable"
              description="Run it on your own infrastructure with Docker. Your data stays yours."
            />
            <FeatureCard
              icon={<Webhook className="h-5 w-5" />}
              title="Webhook integrations"
              description="Send alerts to any HTTP endpoint. Build custom workflows on top."
            />
            <FeatureCard
              icon={<Activity className="h-5 w-5" />}
              title="Alert history"
              description="Full audit trail of every alert sent. See delivery status and retry attempts."
            />
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="relative border-t border-border/20 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary/80">
              Integrations
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Alerts where you already are
            </h2>
            <p className="mt-4 text-muted-foreground">
              No new app to check. Get notified in the tools your team already
              uses.
            </p>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <IntegrationBadge icon={<MailIcon />} label="Email" />
            <IntegrationBadge
              icon={<SlackIcon className="h-5 w-5" />}
              label="Slack"
            />
            <IntegrationBadge
              icon={<DiscordIcon className="h-5 w-5" />}
              label="Discord"
            />
            <IntegrationBadge
              icon={<TelegramIcon className="h-5 w-5" />}
              label="Telegram"
            />
            <IntegrationBadge
              icon={<Webhook className="h-5 w-5" />}
              label="Webhooks"
            />
          </div>
        </div>
      </section>

      {/* Open source CTA */}
      <section className="border-t border-border/20 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent px-8 py-16 text-center sm:px-16 sm:py-20">
            {/* Decorative glows */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute right-0 top-0 h-[350px] w-[350px] translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/8 blur-[100px]" />
              <div className="absolute bottom-0 left-0 h-[250px] w-[250px] -translate-x-1/3 translate-y-1/3 rounded-full bg-primary/6 blur-[80px]" />
            </div>

            <div className="relative">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Github className="h-3.5 w-3.5" />
                AGPL-3.0 Licensed
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                100% open source
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">
                Self-host it, contribute to it, or use our hosted version. No
                feature gates, no limits.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/dashboard"
                  className="group flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
                >
                  Start monitoring
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="https://github.com/AneeshaRama/cronpulse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center gap-2.5 rounded-xl border border-border/50 bg-background/50 px-7 text-base font-medium transition-all hover:border-border hover:bg-background/80"
                >
                  <Github className="h-4.5 w-4.5" />
                  View source
                </a>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Free forever
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Self-hostable
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  No feature limits
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Docker ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">CronPulse</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Open source cron job monitoring. AGPL-3.0.
          </p>
          <a
            href="https://github.com/AneeshaRama/cronpulse"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative rounded-2xl border border-border/30 bg-card/20 p-7 transition-all hover:border-border/50 hover:bg-card/40">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          {icon}
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {step}
        </span>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-border/30 bg-card/20 p-7 transition-all hover:border-border/50 hover:bg-card/40">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function IntegrationBadge({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-border/30 bg-card/20 px-7 py-5 transition-all hover:border-border/50 hover:bg-card/40">
      <div className="text-muted-foreground transition-colors group-hover:text-foreground/80">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function MailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

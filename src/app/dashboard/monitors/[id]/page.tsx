import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { monitors, pings, projects } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Radio,
  Shield,
  Activity,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { CodeSnippets } from "@/components/code-snippets";
import { PingHistory } from "@/components/ping-history";
import { EditMonitorDialog } from "@/components/edit-monitor-dialog";
import { DeleteMonitorDialog } from "@/components/delete-monitor-dialog";

type MonitorStatus = "pending" | "healthy" | "late" | "down";

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { id } = await params;

  // Fetch monitor with ownership check
  const result = await db
    .select({
      monitor: monitors,
      project: projects,
    })
    .from(monitors)
    .innerJoin(projects, eq(monitors.projectId, projects.id))
    .where(and(eq(monitors.id, id), eq(projects.userId, session.user.id)))
    .then((rows) => rows[0]);

  if (!result) {
    notFound();
  }

  const monitor = result.monitor;

  // Fetch first page of pings + total count
  const PAGE_SIZE = 5;

  const [initialPings, totalResult] = await Promise.all([
    db
      .select()
      .from(pings)
      .where(eq(pings.monitorId, monitor.id))
      .orderBy(desc(pings.pingedAt))
      .limit(PAGE_SIZE),
    db
      .select({ total: count() })
      .from(pings)
      .where(eq(pings.monitorId, monitor.id))
      .then((rows) => rows[0]),
  ]);

  const totalPings = totalResult?.total ?? 0;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const pingUrl = `${baseUrl}/api/ping/${monitor.pingUrl}`;
  const graceMins = Math.floor(monitor.gracePeriod / 60);

  const statusConfig: Record<
    MonitorStatus,
    { label: string; dotColor: string; badgeClass: string }
  > = {
    pending: {
      label: "Pending",
      dotColor: "bg-amber-400",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    },
    healthy: {
      label: "Healthy",
      dotColor: "bg-emerald-400",
      badgeClass:
        "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    },
    late: {
      label: "Late",
      dotColor: "bg-yellow-400",
      badgeClass:
        "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    },
    down: {
      label: "Down",
      dotColor: "bg-red-400",
      badgeClass: "bg-red-500/15 text-red-400 border-red-500/20",
    },
  };

  const status = statusConfig[monitor.status];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Top bar: back link + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
        <div className="flex items-center gap-2">
          <EditMonitorDialog
            monitor={{
              id: monitor.id,
              name: monitor.name,
              schedule: monitor.schedule,
              gracePeriod: monitor.gracePeriod,
            }}
          />
          <DeleteMonitorDialog
            monitor={{
              id: monitor.id,
              name: monitor.name,
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex h-4 w-4 items-center justify-center">
            {(monitor.status === "healthy" || monitor.status === "late" || monitor.status === "down") && (
              <div
                className={`absolute h-4 w-4 rounded-full ${status.dotColor} animate-ping opacity-30`}
              />
            )}
            <div
              className={`h-3 w-3 rounded-full ${status.dotColor}`}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {monitor.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Created {formatDate(monitor.createdAt)}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`${status.badgeClass} text-sm px-3 py-1`}>
          {status.label}
        </Badge>
      </div>

      {/* Ping URL card */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Ping URL
        </p>
        <div className="flex items-center gap-3 rounded-lg bg-muted/40 border border-border/40 px-4 py-3">
          <code className="flex-1 text-sm font-mono text-primary break-all select-all">
            {pingUrl}
          </code>
          <CopyButton text={pingUrl} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Send a <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">GET</code> or{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">POST</code> request
          to this URL at the end of your cron job to report a successful run.
        </p>
      </div>

      {/* Code snippets */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Integration examples
        </p>
        <CodeSnippets pingUrl={pingUrl} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DetailCard
          icon={Calendar}
          label="Schedule"
          value={monitor.schedule}
          mono
        />
        <DetailCard
          icon={Shield}
          label="Grace period"
          value={`${graceMins} min`}
        />
        <DetailCard
          icon={Radio}
          label="Last ping"
          value={
            monitor.lastPingAt
              ? timeAgo(monitor.lastPingAt)
              : "Never"
          }
        />
        <DetailCard
          icon={Activity}
          label="Total pings"
          value={String(totalPings)}
        />
      </div>

      {/* Ping history */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Ping history
        </p>
        <PingHistory
          monitorId={monitor.id}
          initialData={{
            pings: initialPings.map((p) => ({
              ...p,
              pingedAt: p.pingedAt.toISOString(),
              createdAt: p.createdAt.toISOString(),
            })),
            total: totalPings,
            hasMore: initialPings.length < totalPings,
          }}
        />
      </div>
    </div>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p
        className={`text-sm font-medium ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


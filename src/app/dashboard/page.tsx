import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { monitors, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Radio,
} from "lucide-react";
import { CreateMonitorDialog } from "@/components/create-monitor-dialog";

type MonitorStatus = "pending" | "healthy" | "late" | "down";

interface Monitor {
  id: string;
  name: string;
  status: MonitorStatus;
  schedule: string;
  gracePeriod: number;
  lastPingAt: Date | null;
  pingUrl: string;
  createdAt: Date;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { projectId } = await searchParams;

  // Get all user projects
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id));

  if (userProjects.length === 0) {
    redirect("/signin");
  }

  // Use requested project or fall back to first
  const project =
    (projectId && userProjects.find((p) => p.id === projectId)) ||
    userProjects[0];

  if (!project) {
    redirect("/signin");
  }

  const jobList = await db
    .select()
    .from(monitors)
    .where(eq(monitors.projectId, project.id));

  const counts = {
    total: jobList.length,
    healthy: jobList.filter((m) => m.status === "healthy").length,
    late: jobList.filter((m) => m.status === "late").length,
    down: jobList.filter((m) => m.status === "down").length,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your cron jobs in{" "}
            <span className="text-foreground/70 font-medium">
              {project.name}
            </span>
          </p>
        </div>
        <CreateMonitorDialog projectId={project.id} />
      </div>

      {/* Stats overview */}
      {jobList.length > 0 && <StatsRow counts={counts} />}

      {/* Monitor list */}
      {jobList.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              All monitors
            </p>
            <p className="text-xs text-muted-foreground">
              {counts.total} total
            </p>
          </div>
          <div className="space-y-2">
            {jobList.map((monitor) => (
              <MonitorCard key={monitor.id} monitor={monitor} projectId={project.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatsRow({
  counts,
}: {
  counts: { total: number; healthy: number; late: number; down: number };
}) {
  const stats = [
    {
      label: "Total",
      value: counts.total,
      icon: Activity,
      color: "text-foreground",
      bg: "bg-foreground/10",
      border: "border-border/50",
    },
    {
      label: "Healthy",
      value: counts.healthy,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Late",
      value: counts.late,
      icon: AlertTriangle,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    {
      label: "Down",
      value: counts.down,
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl border ${stat.border} ${stat.bg} p-4`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </p>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </div>
          <p className={`mt-2 text-2xl font-semibold tracking-tight ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function MonitorCard({ monitor, projectId }: { monitor: Monitor; projectId?: string }) {
  const statusConfig: Record<
    MonitorStatus,
    { label: string; className: string }
  > = {
    pending: {
      label: "Pending",
      className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    },
    healthy: {
      label: "Healthy",
      className:
        "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    },
    late: {
      label: "Late",
      className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    },
    down: {
      label: "Down",
      className: "bg-red-500/15 text-red-400 border-red-500/20",
    },
  };

  const status = statusConfig[monitor.status];
  const graceMins = Math.floor(monitor.gracePeriod / 60);

  return (
    <Link
      href={`/dashboard/monitors/${monitor.id}${projectId ? `?projectId=${projectId}` : ""}`}
      className="group block rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80 hover:border-border"
    >
      <div className="flex items-center justify-between">
        {/* Left: status + name */}
        <div className="flex items-center gap-3 min-w-0">
          <StatusDot status={monitor.status} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{monitor.name}</p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{monitor.schedule}</span>
              <span className="opacity-30">|</span>
              <span>{graceMins}m grace</span>
            </div>
          </div>
        </div>

        {/* Right: last ping + badge */}
        <div className="flex items-center gap-3 shrink-0 pl-4">
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            {monitor.lastPingAt ? (
              <>
                <Radio className="h-3 w-3" />
                <span>{timeAgo(monitor.lastPingAt)}</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>Awaiting first ping</span>
              </>
            )}
          </div>
          <Badge variant="outline" className={status.className}>
            {status.label}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

function StatusDot({ status }: { status: MonitorStatus }) {
  const colors: Record<MonitorStatus, string> = {
    pending: "bg-amber-400",
    healthy: "bg-emerald-400",
    late: "bg-yellow-400",
    down: "bg-red-400",
  };

  return (
    <div className="relative flex h-3 w-3 shrink-0 items-center justify-center">
      {(status === "late" || status === "down") && (
        <div
          className={`absolute h-3 w-3 rounded-full ${colors[status]} animate-ping opacity-30`}
        />
      )}
      <div className={`h-2 w-2 rounded-full ${colors[status]}`} />
    </div>
  );
}

function EmptyState() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-20">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-5">
        <Activity className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold mb-1">No monitors yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs text-center">
        Create a monitor to start tracking your cron jobs. You&apos;ll get a
        unique ping URL to add to your scripts.
      </p>
      <div className="rounded-lg bg-muted/50 border border-border/50 px-4 py-3">
        <code className="text-sm font-mono text-primary">
          {baseUrl}/api/ping/your-ping-url
        </code>
        <p className="text-xs text-muted-foreground mt-2">
          Send a{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono text-foreground">GET</code>{" "}
          or{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono text-foreground">POST</code>{" "}
          request to your unique ping URL at the end of your cron job.
        </p>
      </div>
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

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduledJobs, scheduledRuns, projects } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Timer,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Play,
} from "lucide-react";
import { CreateScheduledJobDialog } from "@/components/create-scheduled-job-dialog";

type JobStatus = "active" | "paused";

interface ScheduledJob {
  id: string;
  name: string;
  status: JobStatus;
  type: string;
  schedule: string;
  httpUrl: string | null;
  httpMethod: string;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
}

export default async function ScheduledPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { projectId } = await searchParams;

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id));

  if (userProjects.length === 0) {
    redirect("/signin");
  }

  const project =
    (projectId && userProjects.find((p) => p.id === projectId)) ||
    userProjects[0];

  if (!project) {
    redirect("/signin");
  }

  const jobList = await db
    .select()
    .from(scheduledJobs)
    .where(eq(scheduledJobs.projectId, project.id));

  // Get the latest run for each job
  const latestRuns = new Map<string, { status: string; completedAt: Date }>();
  for (const job of jobList) {
    const runs = await db
      .select()
      .from(scheduledRuns)
      .where(eq(scheduledRuns.jobId, job.id))
      .orderBy(desc(scheduledRuns.completedAt))
      .limit(1);
    if (runs.length > 0) {
      latestRuns.set(job.id, {
        status: runs[0].status,
        completedAt: runs[0].completedAt,
      });
    }
  }

  const counts = {
    total: jobList.length,
    active: jobList.filter((j) => j.status === "active").length,
    paused: jobList.filter((j) => j.status === "paused").length,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scheduled Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jobs that CronPulse runs for you on a schedule in{" "}
            <span className="text-foreground/70 font-medium">
              {project.name}
            </span>
          </p>
        </div>
        <CreateScheduledJobDialog projectId={project.id} />
      </div>

      {/* Stats overview */}
      {jobList.length > 0 && <StatsRow counts={counts} />}

      {/* Job list */}
      {jobList.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              All scheduled jobs
            </p>
            <p className="text-xs text-muted-foreground">
              {counts.total} total
            </p>
          </div>
          <div className="space-y-2">
            {jobList.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                projectId={project.id}
                lastRun={latestRuns.get(job.id)}
              />
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
  counts: { total: number; active: number; paused: number };
}) {
  const stats = [
    {
      label: "Total",
      value: counts.total,
      icon: Timer,
      color: "text-foreground",
      bg: "bg-foreground/10",
      border: "border-border/50",
    },
    {
      label: "Active",
      value: counts.active,
      icon: Play,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Paused",
      value: counts.paused,
      icon: Pause,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
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
          <p
            className={`mt-2 text-2xl font-semibold tracking-tight ${stat.color}`}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function JobCard({
  job,
  projectId,
  lastRun,
}: {
  job: ScheduledJob;
  projectId: string;
  lastRun?: { status: string; completedAt: Date };
}) {
  const statusConfig: Record<
    JobStatus,
    { label: string; className: string }
  > = {
    active: {
      label: "Active",
      className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    },
    paused: {
      label: "Paused",
      className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    },
  };

  const status = statusConfig[job.status];

  const lastRunIcon = lastRun?.status === "success" ? CheckCircle2 :
    lastRun?.status === "failed" || lastRun?.status === "timeout" ? XCircle : null;
  const lastRunColor = lastRun?.status === "success" ? "text-emerald-400" :
    "text-red-400";

  return (
    <Link
      href={`/dashboard/scheduled/${job.id}?projectId=${projectId}`}
      className="group block rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80 hover:border-border"
    >
      <div className="flex items-center justify-between">
        {/* Left: name + details */}
        <div className="flex items-center gap-3 min-w-0">
          <StatusDot status={job.status} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{job.name}</p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{job.schedule}</span>
              <span className="opacity-30">|</span>
              <span>{job.type === "http" ? job.httpMethod : "Reminder"}</span>
            </div>
          </div>
        </div>

        {/* Right: last run + badge */}
        <div className="flex items-center gap-3 shrink-0 pl-4">
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            {lastRun ? (
              <>
                {lastRunIcon && (
                  <span className={lastRunColor}>
                    {lastRun.status === "success" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                  </span>
                )}
                <span>{timeAgo(lastRun.completedAt)}</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>No runs yet</span>
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

function StatusDot({ status }: { status: JobStatus }) {
  const colors: Record<JobStatus, string> = {
    active: "bg-emerald-400",
    paused: "bg-yellow-400",
  };

  return (
    <div className="relative flex h-3 w-3 shrink-0 items-center justify-center">
      {status === "active" && (
        <div
          className={`absolute h-3 w-3 rounded-full ${colors[status]} animate-ping opacity-30`}
        />
      )}
      <div className={`h-2 w-2 rounded-full ${colors[status]}`} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-20">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-5">
        <Timer className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold mb-1">No scheduled jobs yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs text-center">
        Create a scheduled job and CronPulse will execute HTTP calls on your
        defined cron schedule. No server needed.
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

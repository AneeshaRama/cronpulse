import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduledJobs, scheduledRuns, projects } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Globe,
  Timer,
  Activity,
  Clock,
} from "lucide-react";
import { RunHistory } from "@/components/run-history";
import { EditScheduledJobDialog } from "@/components/edit-scheduled-job-dialog";
import { DeleteScheduledJobDialog } from "@/components/delete-scheduled-job-dialog";
import { PauseResumeButton } from "@/components/pause-resume-button";
import { TriggerJobButton } from "@/components/trigger-job-button";

type JobStatus = "active" | "paused";

export default async function ScheduledJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { id } = await params;
  const { projectId } = await searchParams;
  const backHref = projectId
    ? `/dashboard/scheduled?projectId=${projectId}`
    : "/dashboard/scheduled";

  const result = await db
    .select({
      job: scheduledJobs,
      project: projects,
    })
    .from(scheduledJobs)
    .innerJoin(projects, eq(scheduledJobs.projectId, projects.id))
    .where(
      and(eq(scheduledJobs.id, id), eq(projects.userId, session.user.id)),
    )
    .then((rows) => rows[0]);

  if (!result) {
    notFound();
  }

  const job = result.job;

  const PAGE_SIZE = 5;

  const [initialRuns, totalResult] = await Promise.all([
    db
      .select()
      .from(scheduledRuns)
      .where(eq(scheduledRuns.jobId, job.id))
      .orderBy(desc(scheduledRuns.startedAt))
      .limit(PAGE_SIZE),
    db
      .select({ total: count() })
      .from(scheduledRuns)
      .where(eq(scheduledRuns.jobId, job.id))
      .then((rows) => rows[0]),
  ]);

  const totalRuns = totalResult?.total ?? 0;

  const statusConfig: Record<
    JobStatus,
    { label: string; dotColor: string; badgeClass: string }
  > = {
    active: {
      label: "Active",
      dotColor: "bg-emerald-400",
      badgeClass:
        "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    },
    paused: {
      label: "Paused",
      dotColor: "bg-yellow-400",
      badgeClass:
        "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    },
  };

  const status = statusConfig[job.status];
  const timeoutSec = job.timeoutMs / 1000;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to scheduled jobs
        </Link>
        <div className="flex items-center gap-2">
          <TriggerJobButton jobId={job.id} />
          <PauseResumeButton jobId={job.id} currentStatus={job.status} />
          <EditScheduledJobDialog
            job={{
              id: job.id,
              name: job.name,
              type: job.type,
              schedule: job.schedule,
              httpUrl: job.httpUrl,
              httpMethod: job.httpMethod,
              httpBody: job.httpBody,
              timeoutMs: job.timeoutMs,
              status: job.status,
            }}
          />
          <DeleteScheduledJobDialog
            job={{
              id: job.id,
              name: job.name,
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex h-4 w-4 items-center justify-center">
            {job.status === "active" && (
              <div
                className={`absolute h-4 w-4 rounded-full ${status.dotColor} animate-ping opacity-30`}
              />
            )}
            <div className={`h-3 w-3 rounded-full ${status.dotColor}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{job.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Created {formatDate(job.createdAt)}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`${status.badgeClass} text-sm px-3 py-1`}
        >
          {status.label}
        </Badge>
      </div>

      {/* Job config card */}
      {job.type === "http" && job.httpUrl && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            HTTP Endpoint
          </p>
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 border border-border/40 px-4 py-3">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 font-mono text-xs shrink-0"
            >
              {job.httpMethod}
            </Badge>
            <code className="flex-1 text-sm font-mono text-foreground/80 break-all">
              {job.httpUrl}
            </code>
          </div>
        </div>
      )}

      {job.type === "reminder" && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Job type
          </p>
          <p className="text-sm text-muted-foreground">
            This is a reminder job. It sends a notification to your configured
            alert channels on schedule.
          </p>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DetailCard
          icon={Calendar}
          label="Schedule"
          value={job.schedule}
          mono
        />
        <DetailCard
          icon={Clock}
          label="Next run"
          value={job.nextRunAt ? timeAgo(job.nextRunAt) : "N/A"}
        />
        <DetailCard
          icon={Globe}
          label={job.type === "http" ? "Timeout" : "Type"}
          value={job.type === "http" ? `${timeoutSec}s` : "Reminder"}
        />
        <DetailCard
          icon={Activity}
          label="Total runs"
          value={String(totalRuns)}
        />
      </div>

      {/* Run history */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Execution history
        </p>
        <RunHistory
          jobId={job.id}
          initialData={{
            runs: initialRuns.map((r) => ({
              ...r,
              startedAt: r.startedAt.toISOString(),
              completedAt: r.completedAt.toISOString(),
              createdAt: r.createdAt.toISOString(),
            })),
            total: totalRuns,
            hasMore: initialRuns.length < totalRuns,
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
      <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  // Future date (next run)
  if (diff > 0) {
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "in a moment";
    if (seconds < 3600) return `in ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `in ${Math.floor(seconds / 3600)}h`;
    return `in ${Math.floor(seconds / 86400)}d`;
  }

  // Past date
  const seconds = Math.floor(-diff / 1000);
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

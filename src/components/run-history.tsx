"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2 } from "lucide-react";

interface Run {
  id: string;
  jobId: string;
  status: string;
  responseCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string;
}

interface InitialData {
  runs: Run[];
  total: number;
  hasMore: boolean;
}

export function RunHistory({
  jobId,
  initialData,
}: {
  jobId: string;
  initialData: InitialData;
}) {
  const [allRuns, setAllRuns] = useState<Run[]>(initialData.runs);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [total, setTotal] = useState(initialData.total);
  const [offset, setOffset] = useState(initialData.runs.length);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/scheduled-jobs/${jobId}/runs?offset=${offset}&limit=5`,
      );
      if (!res.ok) throw new Error("Failed to load runs");

      const data = await res.json();
      setAllRuns((prev) => [...prev, ...data]);
      const newTotal = offset + data.length;
      setHasMore(data.length === 5);
      setOffset(newTotal);
      if (data.length < 5) setTotal(newTotal);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-12">
        <Clock className="h-5 w-5 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No runs yet</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          This job will run on its next scheduled time
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/50 bg-card/50 divide-y divide-border/30">
        {allRuns.map((run) => {
          const date = new Date(run.startedAt);
          const statusConfig: Record<
            string,
            { label: string; className: string; dotColor: string }
          > = {
            success: {
              label: "Success",
              className:
                "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
              dotColor: "bg-emerald-400",
            },
            failed: {
              label: "Failed",
              className: "bg-red-500/15 text-red-400 border-red-500/20",
              dotColor: "bg-red-400",
            },
            timeout: {
              label: "Timeout",
              className:
                "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
              dotColor: "bg-yellow-400",
            },
          };

          const status = statusConfig[run.status] ?? statusConfig.failed;

          return (
            <div
              key={run.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${status.dotColor}`}
                />
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="outline"
                    className={`${status.className} text-[11px] px-1.5 py-0`}
                  >
                    {status.label}
                  </Badge>
                  {run.responseCode && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {run.responseCode}
                    </span>
                  )}
                  {run.responseTimeMs != null && (
                    <span className="text-xs text-muted-foreground/60">
                      {run.responseTimeMs}ms
                    </span>
                  )}
                  {run.errorMessage && (
                    <span className="text-xs text-red-400/70 truncate max-w-[200px]">
                      {run.errorMessage}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono shrink-0 pl-4">
                <span className="text-muted-foreground/60">
                  {formatDate(date)}
                </span>
                <span className="text-muted-foreground">
                  {formatTime(date)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {allRuns.length} of {total} runs
        </p>
        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loading}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? "Loading..." : "Load more"}
          </Button>
        )}
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

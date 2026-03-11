"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Loader2 } from "lucide-react";

interface Ping {
  id: string;
  monitorId: string;
  pingedAt: string;
  createdAt: string;
}

interface InitialData {
  pings: Ping[];
  total: number;
  hasMore: boolean;
}

export function PingHistory({
  monitorId,
  initialData,
}: {
  monitorId: string;
  initialData: InitialData;
}) {
  const [allPings, setAllPings] = useState<Ping[]>(initialData.pings);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(
        `/api/jobs/${monitorId}/pings?page=${nextPage}`
      );
      if (!res.ok) throw new Error("Failed to load pings");

      const data = await res.json();
      setAllPings((prev) => [...prev, ...data.pings]);
      setHasMore(data.hasMore);
      setTotal(data.total);
      setPage(nextPage);
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-12">
        <Clock className="h-5 w-5 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No pings received yet</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Send your first ping to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/50 bg-card/50 divide-y divide-border/30">
        {allPings.map((ping) => {
          const date = new Date(ping.pingedAt);
          return (
            <div
              key={ping.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm">Ping received</span>
                <span className="text-xs text-muted-foreground/60">
                  {timeAgo(date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
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

      {/* Footer: count + load more */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {allPings.length} of {total} pings
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

function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

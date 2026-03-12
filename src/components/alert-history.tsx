"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Webhook,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
} from "lucide-react";
import { SlackIcon, DiscordIcon, TelegramIcon } from "@/components/icons";

interface Alert {
  id: string;
  status: string;
  monitorName: string;
  monitorStatus: string;
  channelType: string;
  channelConfig: unknown;
  attempts: number;
  sentAt: string | null;
  createdAt: string;
}

interface AlertHistoryProps {
  projectId: string;
  initialData: {
    alerts: Alert[];
    total: number;
    hasMore: boolean;
  };
}

export function AlertHistory({ projectId, initialData }: AlertHistoryProps) {
  const [alerts, setAlerts] = useState<Alert[]>(initialData.alerts);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(
        `/api/alerts?projectId=${projectId}&page=${nextPage}`,
      );
      if (!res.ok) throw new Error("Failed to load");

      const data = await res.json();
      setAlerts((prev) => [...prev, ...data.alerts]);
      setHasMore(data.hasMore);
      setTotal(data.total);
      setPage(nextPage);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          All alerts
        </p>
        <p className="text-xs text-muted-foreground">{total} total</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 divide-y divide-border/30">
        {alerts.map((alert, index) => (
          <AlertRow key={`${alert.id}-${index}`} alert={alert} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={loading}
            className="text-muted-foreground"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const channelIcon = getChannelIcon(alert.channelType);
  const channelLabel = getChannelLabel(alert.channelType, alert.channelConfig);
  const statusConfig = getAlertStatusConfig(alert.status);
  const monitorStatusConfig = getMonitorStatusConfig(alert.monitorStatus);
  const timestamp = alert.sentAt || alert.createdAt;

  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      {/* Monitor status indicator */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${monitorStatusConfig.bg}`}
      >
        <monitorStatusConfig.icon
          className={`h-3.5 w-3.5 ${monitorStatusConfig.color}`}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{alert.monitorName}</p>
          <span
            className={`text-[10px] font-medium px-1.5 py-px rounded-full ${monitorStatusConfig.badge}`}
          >
            {alert.monitorStatus}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {channelIcon}
            <span>{channelLabel}</span>
          </div>
          <span className="text-muted-foreground/30">|</span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(timestamp)}
          </span>
        </div>
      </div>

      {/* Delivery status */}
      <div className="flex items-center gap-1.5 shrink-0">
        <statusConfig.icon
          className={`h-3.5 w-3.5 ${statusConfig.color}`}
        />
        <span className={`text-xs font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>
    </div>
  );
}

function getChannelIcon(type: string) {
  switch (type) {
    case "email":
      return <Mail className="h-3 w-3" />;
    case "slack":
      return <SlackIcon className="h-3 w-3" />;
    case "discord":
      return <DiscordIcon className="h-3 w-3" />;
    case "telegram":
      return <TelegramIcon className="h-3 w-3" />;
    case "webhook":
      return <Webhook className="h-3 w-3" />;
    default:
      return <Send className="h-3 w-3" />;
  }
}

function getChannelLabel(type: string, config: unknown) {
  switch (type) {
    case "email":
      return (config as { email: string })?.email || "Email";
    case "slack":
      return "Slack";
    case "discord":
      return "Discord";
    case "telegram":
      return `Telegram`;
    case "webhook": {
      try {
        const url = new URL((config as { url: string }).url);
        return url.host;
      } catch {
        return "Webhook";
      }
    }
    default:
      return type;
  }
}

function getAlertStatusConfig(status: string) {
  switch (status) {
    case "sent":
      return {
        label: "Sent",
        icon: CheckCircle2,
        color: "text-emerald-400",
      };
    case "failed":
      return {
        label: "Failed",
        icon: XCircle,
        color: "text-red-400",
      };
    case "pending":
    default:
      return {
        label: "Pending",
        icon: Clock,
        color: "text-amber-400",
      };
  }
}

function getMonitorStatusConfig(status: string) {
  switch (status) {
    case "late":
      return {
        icon: AlertTriangle,
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        badge: "bg-yellow-500/15 text-yellow-400",
      };
    case "down":
      return {
        icon: XCircle,
        color: "text-red-400",
        bg: "bg-red-500/10",
        badge: "bg-red-500/15 text-red-400",
      };
    default:
      return {
        icon: AlertTriangle,
        color: "text-muted-foreground",
        bg: "bg-muted/50",
        badge: "bg-muted text-muted-foreground",
      };
  }
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

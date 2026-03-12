"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface WebhookChannel {
  id: string;
  url: string;
  label?: string;
  enabled: boolean;
}

export function WebhookAlertSettings({
  projectId,
  initialChannels,
}: {
  projectId: string;
  initialChannels: WebhookChannel[];
}) {
  const [channels, setChannels] = useState<WebhookChannel[]>(initialChannels);
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) return;

    setAdding(true);
    try {
      const res = await fetch("/api/alert-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, type: "webhook", url: url.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add webhook");
      }
      const channel = await res.json();
      const config = channel.config as { url: string; label?: string };
      setChannels((prev) => [
        ...prev,
        {
          id: channel.id,
          url: config.url,
          label: config.label,
          enabled: channel.enabled,
        },
      ]);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(id: string, currentEnabled: boolean) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/alert-channels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === id ? { ...ch, enabled: !currentEnabled } : ch,
        ),
      );
    } catch {
      // State stays the same
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/alert-channels/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setChannels((prev) => prev.filter((ch) => ch.id !== id));
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null);
    }
  }

  function truncateUrl(urlStr: string) {
    try {
      const parsed = new URL(urlStr);
      const path =
        parsed.pathname.length > 20
          ? parsed.pathname.slice(0, 20) + "..."
          : parsed.pathname;
      return `${parsed.host}${path}`;
    } catch {
      return urlStr.slice(0, 40);
    }
  }

  return (
    <div className="space-y-3">
      {channels.length > 0 && (
        <div className="divide-y divide-border/30">
          {channels.map((channel) => (
            <div key={channel.id} className="flex items-center justify-between py-2.5 first:pt-0">
              <span className="text-sm font-mono text-muted-foreground truncate">
                {truncateUrl(channel.url)}
              </span>
              <div className="flex items-center gap-2 shrink-0 pl-4">
                <button
                  type="button"
                  onClick={() => handleToggle(channel.id, channel.enabled)}
                  disabled={togglingId === channel.id}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    channel.enabled ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      channel.enabled ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(channel.id)}
                  disabled={deletingId === channel.id}
                  className="text-muted-foreground hover:text-red-400"
                >
                  {deletingId === channel.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          type="url"
          placeholder="https://your-server.com/webhook"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          className="flex-1 font-mono text-sm"
        />
        <Button type="submit" size="sm" disabled={adding || !url.trim()}>
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus data-icon="inline-start" className="h-4 w-4" />
          )}
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

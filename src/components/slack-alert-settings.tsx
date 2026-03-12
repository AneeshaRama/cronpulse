"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface SlackChannel {
  id: string;
  webhookUrl: string;
  enabled: boolean;
}

export function SlackAlertSettings({
  projectId,
  initialChannels,
}: {
  projectId: string;
  initialChannels: SlackChannel[];
}) {
  const [channels, setChannels] = useState<SlackChannel[]>(initialChannels);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!webhookUrl.trim()) return;

    setAdding(true);
    try {
      const res = await fetch("/api/alert-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, type: "slack", webhookUrl: webhookUrl.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add Slack webhook");
      }
      const channel = await res.json();
      setChannels((prev) => [
        ...prev,
        {
          id: channel.id,
          webhookUrl: (channel.config as { webhookUrl: string }).webhookUrl,
          enabled: channel.enabled,
        },
      ]);
      setWebhookUrl("");
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

  function maskUrl(url: string) {
    try {
      const parts = url.split("/");
      return `hooks.slack.com/.../${parts[parts.length - 1].slice(0, 6)}`;
    } catch {
      return "***";
    }
  }

  return (
    <div className="space-y-3">
      {channels.length > 0 && (
        <div className="divide-y divide-border/30">
          {channels.map((channel) => (
            <div key={channel.id} className="flex items-center justify-between py-2.5 first:pt-0">
              <span className="text-sm font-mono text-muted-foreground truncate">
                {maskUrl(channel.webhookUrl)}
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
          placeholder="https://hooks.slack.com/services/..."
          value={webhookUrl}
          onChange={(e) => {
            setWebhookUrl(e.target.value);
            setError(null);
          }}
          className="flex-1 font-mono text-sm"
        />
        <Button type="submit" size="sm" disabled={adding || !webhookUrl.trim()}>
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

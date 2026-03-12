"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

interface EmailChannel {
  id: string;
  email: string;
  enabled: boolean;
}

export function EmailAlertSettings({
  projectId,
  initialChannels,
}: {
  projectId: string;
  initialChannels: EmailChannel[];
}) {
  const [channels, setChannels] = useState<EmailChannel[]>(initialChannels);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!newEmail.trim()) return;

    setAdding(true);

    try {
      const res = await fetch("/api/alert-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, email: newEmail.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add email");
      }

      const channel = await res.json();
      setChannels((prev) => [
        ...prev,
        {
          id: channel.id,
          email: (channel.config as { email: string }).email,
          enabled: channel.enabled,
        },
      ]);
      setNewEmail("");
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
      // Silently fail — state stays the same
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const res = await fetch(`/api/alert-channels/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setChannels((prev) => prev.filter((ch) => ch.id !== id));
    } catch {
      // Silently fail
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Channel list */}
      {channels.length > 0 ? (
        <div className="rounded-xl border border-border/50 bg-card/50 divide-y divide-border/30">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{channel.email}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 pl-4">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(channel.id, channel.enabled)}
                  disabled={togglingId === channel.id}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    channel.enabled
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      channel.enabled ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                {/* Delete */}
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
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-10">
          <Mail className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No email alerts configured
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Add an email below to start receiving alerts
          </p>
        </div>
      )}

      {/* Add email form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          type="email"
          placeholder="Add email address"
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value);
            setError(null);
          }}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={adding || !newEmail.trim()}>
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus data-icon="inline-start" className="h-4 w-4" />
          )}
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

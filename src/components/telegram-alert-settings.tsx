"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface TelegramChannel {
  id: string;
  chatId: string;
  enabled: boolean;
}

export function TelegramAlertSettings({
  projectId,
  initialChannels,
}: {
  projectId: string;
  initialChannels: TelegramChannel[];
}) {
  const [channels, setChannels] = useState<TelegramChannel[]>(initialChannels);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!botToken.trim() || !chatId.trim()) return;

    setAdding(true);
    try {
      const res = await fetch("/api/alert-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          type: "telegram",
          botToken: botToken.trim(),
          chatId: chatId.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add Telegram bot");
      }
      const channel = await res.json();
      setChannels((prev) => [
        ...prev,
        {
          id: channel.id,
          chatId: (channel.config as { chatId: string }).chatId,
          enabled: channel.enabled,
        },
      ]);
      setBotToken("");
      setChatId("");
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

  return (
    <div className="space-y-3">
      {channels.length > 0 && (
        <div className="divide-y divide-border/30">
          {channels.map((channel) => (
            <div key={channel.id} className="flex items-center justify-between py-2.5 first:pt-0">
              <span className="text-sm text-muted-foreground truncate">
                Chat <span className="font-mono">{channel.chatId}</span>
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

      {/* Setup guide */}
      <button
        type="button"
        onClick={() => setShowGuide(!showGuide)}
        className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors"
      >
        {showGuide ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        How to get your bot token and chat ID
      </button>

      {showGuide && (
        <div className="rounded-lg bg-muted/30 border border-border/30 p-4 space-y-3">
          <div className="space-y-2.5">
            <Step number={1}>
              Open Telegram and search for{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">@BotFather</code>
            </Step>
            <Step number={2}>
              Send{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">/newbot</code>
              {" "}and follow the prompts to create your bot. You&apos;ll receive a <strong className="text-foreground">bot token</strong>.
            </Step>
            <Step number={3}>
              Add the bot to your group chat, or start a direct message with it.
            </Step>
            <Step number={4}>
              To get the <strong className="text-foreground">chat ID</strong>, send a message to the bot, then open:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground break-all">
                https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates
              </code>
            </Step>
            <Step number={5}>
              Find{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">{`"chat":{"id":`}</code>
              {" "}in the response. That number is your chat ID. For groups, it starts with{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">-100</code>.
            </Step>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleAdd} className="space-y-2.5">
        <div className="space-y-1.5">
          <Label htmlFor="telegram-bot-token" className="text-xs text-muted-foreground">
            Bot token
          </Label>
          <Input
            id="telegram-bot-token"
            type="text"
            placeholder="123456789:ABCDefGhIJKlmNoPQRsTUVwxyz"
            value={botToken}
            onChange={(e) => {
              setBotToken(e.target.value);
              setError(null);
            }}
            className="font-mono text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="telegram-chat-id" className="text-xs text-muted-foreground">
              Chat ID
            </Label>
            <Input
              id="telegram-chat-id"
              type="text"
              placeholder="-1001234567890"
              value={chatId}
              onChange={(e) => {
                setChatId(e.target.value);
                setError(null);
              }}
              className="font-mono text-sm"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={adding || !botToken.trim() || !chatId.trim()}
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus data-icon="inline-start" className="h-4 w-4" />
            )}
            {adding ? "Adding..." : "Add"}
          </Button>
        </div>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary mt-0.5">
        {number}
      </span>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {children}
      </p>
    </div>
  );
}

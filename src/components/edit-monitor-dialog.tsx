"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Loader2 } from "lucide-react";

const CRON_PRESETS = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every week (Sunday)", value: "0 0 * * 0" },
] as const;

const GRACE_OPTIONS = [
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "30 minutes", value: 1800 },
  { label: "1 hour", value: 3600 },
] as const;

interface MonitorData {
  id: string;
  name: string;
  schedule: string;
  gracePeriod: number;
}

export function EditMonitorDialog({ monitor }: { monitor: MonitorData }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(monitor.name);
  const [schedule, setSchedule] = useState(() => {
    const match = CRON_PRESETS.find((p) => p.value === monitor.schedule);
    return match ? monitor.schedule : "custom";
  });
  const [customSchedule, setCustomSchedule] = useState(
    CRON_PRESETS.find((p) => p.value === monitor.schedule)
      ? ""
      : monitor.schedule
  );
  const [gracePeriod, setGracePeriod] = useState(monitor.gracePeriod);

  const effectiveSchedule = schedule === "custom" ? customSchedule : schedule;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Reset to current values when opening
      setName(monitor.name);
      const match = CRON_PRESETS.find((p) => p.value === monitor.schedule);
      setSchedule(match ? monitor.schedule : "custom");
      setCustomSchedule(match ? "" : monitor.schedule);
      setGracePeriod(monitor.gracePeriod);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!effectiveSchedule.trim()) {
      setError("Cron schedule is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/jobs/${monitor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          schedule: effectiveSchedule.trim(),
          gracePeriod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update monitor");
      }

      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil data-icon="inline-start" className="h-3.5 w-3.5" />
            Edit
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit monitor</DialogTitle>
            <DialogDescription>
              Update the configuration for this monitor. Changes take effect
              immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-monitor-name">Monitor name</Label>
              <Input
                id="edit-monitor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <Label>Expected schedule</Label>
              <Select
                value={schedule}
                onValueChange={(val) => setSchedule(val as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRON_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      <span>{preset.label}</span>
                      <span className="ml-auto pl-3 font-mono text-xs text-muted-foreground">
                        {preset.value}
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom cron expression</SelectItem>
                </SelectContent>
              </Select>

              {schedule === "custom" && (
                <Input
                  placeholder="* * * * *  (min hour day month weekday)"
                  value={customSchedule}
                  onChange={(e) => setCustomSchedule(e.target.value)}
                  className="font-mono"
                />
              )}

              {effectiveSchedule && schedule !== "custom" && (
                <p className="text-xs font-mono text-muted-foreground">
                  {effectiveSchedule}
                </p>
              )}
            </div>

            {/* Grace period */}
            <div className="space-y-2">
              <Label>Grace period</Label>
              <Select
                value={String(gracePeriod)}
                onValueChange={(val) => setGracePeriod(Number(val))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRACE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="submit" size="lg" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

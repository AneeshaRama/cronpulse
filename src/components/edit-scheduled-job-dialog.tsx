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
import { Textarea } from "@/components/ui/textarea";
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

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"] as const;

const TIMEOUT_OPTIONS = [
  { label: "5 seconds", value: 5000 },
  { label: "10 seconds", value: 10000 },
  { label: "30 seconds", value: 30000 },
  { label: "60 seconds", value: 60000 },
] as const;

interface JobData {
  id: string;
  name: string;
  type: string;
  schedule: string;
  httpUrl: string | null;
  httpMethod: string;
  httpBody: string | null;
  timeoutMs: number;
  status: string;
}

export function EditScheduledJobDialog({ job }: { job: JobData }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(job.name);
  const [schedule, setSchedule] = useState(() => {
    const match = CRON_PRESETS.find((p) => p.value === job.schedule);
    return match ? job.schedule : "custom";
  });
  const [customSchedule, setCustomSchedule] = useState(
    CRON_PRESETS.find((p) => p.value === job.schedule) ? "" : job.schedule,
  );
  const [httpUrl, setHttpUrl] = useState(job.httpUrl ?? "");
  const [httpMethod, setHttpMethod] = useState(job.httpMethod);
  const [httpBody, setHttpBody] = useState(job.httpBody ?? "");
  const [timeoutMs, setTimeoutMs] = useState(job.timeoutMs);

  const effectiveSchedule = schedule === "custom" ? customSchedule : schedule;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setName(job.name);
      const match = CRON_PRESETS.find((p) => p.value === job.schedule);
      setSchedule(match ? job.schedule : "custom");
      setCustomSchedule(match ? "" : job.schedule);
      setHttpUrl(job.httpUrl ?? "");
      setHttpMethod(job.httpMethod);
      setHttpBody(job.httpBody ?? "");
      setTimeoutMs(job.timeoutMs);
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
    if (job.type === "http" && !httpUrl.trim()) {
      setError("HTTP URL is required");
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        schedule: effectiveSchedule.trim(),
        httpMethod,
        timeoutMs,
      };

      if (job.type === "http") {
        body.httpUrl = httpUrl.trim();
        if (
          (httpMethod === "POST" || httpMethod === "PUT") &&
          httpBody.trim()
        ) {
          body.httpBody = httpBody.trim();
        }
      }

      const res = await fetch(`/api/scheduled-jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update job");
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
            <DialogTitle>Edit scheduled job</DialogTitle>
            <DialogDescription>
              Update the configuration for this job. Changes take effect
              immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-job-name">Job name</Label>
              <Input
                id="edit-job-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <Label>Schedule</Label>
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
                  <SelectItem value="custom">
                    Custom cron expression
                  </SelectItem>
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

            {/* HTTP fields */}
            {job.type === "http" && (
              <>
                <div className="space-y-2">
                  <Label>HTTP URL</Label>
                  <div className="flex gap-2">
                    <Select
                      value={httpMethod}
                      onValueChange={(val) => setHttpMethod(val as string)}
                    >
                      <SelectTrigger className="w-28 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HTTP_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="https://api.example.com/webhook"
                      value={httpUrl}
                      onChange={(e) => setHttpUrl(e.target.value)}
                    />
                  </div>
                </div>

                {(httpMethod === "POST" || httpMethod === "PUT") && (
                  <div className="space-y-2">
                    <Label>Request body (optional)</Label>
                    <Textarea
                      placeholder='{"key": "value"}'
                      value={httpBody}
                      onChange={(e) => setHttpBody(e.target.value)}
                      className="font-mono text-sm"
                      rows={3}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Timeout</Label>
                  <Select
                    value={String(timeoutMs)}
                    onValueChange={(val) => setTimeoutMs(Number(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEOUT_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={String(opt.value)}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

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

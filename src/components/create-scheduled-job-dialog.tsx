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
import {
  Plus,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

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

type DialogStep = "form" | "success";

interface CreatedJob {
  id: string;
  name: string;
  schedule: string;
  nextRunAt: string;
}

export function CreateScheduledJobDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<DialogStep>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdJob, setCreatedJob] = useState<CreatedJob | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [customSchedule, setCustomSchedule] = useState("");
  const [type, setType] = useState<"http" | "reminder">("http");
  const [httpUrl, setHttpUrl] = useState("");
  const [httpMethod, setHttpMethod] = useState<string>("GET");
  const [httpBody, setHttpBody] = useState("");
  const [timeoutMs, setTimeoutMs] = useState(30000);

  const effectiveSchedule = schedule === "custom" ? customSchedule : schedule;

  function resetForm() {
    setStep("form");
    setName("");
    setSchedule("");
    setCustomSchedule("");
    setType("http");
    setHttpUrl("");
    setHttpMethod("GET");
    setHttpBody("");
    setTimeoutMs(30000);
    setError(null);
    setLoading(false);
    setCreatedJob(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTimeout(resetForm, 200);
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
    if (type === "http" && !httpUrl.trim()) {
      setError("HTTP URL is required");
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        projectId,
        name: name.trim(),
        schedule: effectiveSchedule.trim(),
        type,
        httpMethod,
        timeoutMs,
      };

      if (type === "http") {
        body.httpUrl = httpUrl.trim();
        if ((httpMethod === "POST" || httpMethod === "PUT") && httpBody.trim()) {
          body.httpBody = httpBody.trim();
        }
      }

      const res = await fetch("/api/scheduled-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create scheduled job");
      }

      const job = await res.json();
      setCreatedJob(job);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleDone() {
    setOpen(false);
    setTimeout(resetForm, 200);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus data-icon="inline-start" className="h-4 w-4" />
            New Scheduled Job
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg">
        {step === "form" ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create a scheduled job</DialogTitle>
              <DialogDescription>
                Set up a job that CronPulse will execute on your defined
                schedule. No server needed.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="job-name">Job name</Label>
                <Input
                  id="job-name"
                  placeholder="e.g. Daily Report, Health Check, Cleanup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Job type</Label>
                <Select
                  value={type}
                  onValueChange={(val) => setType(val as "http" | "reminder")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP Call</SelectItem>
                    <SelectItem value="reminder">Reminder (notification only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cron schedule */}
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select
                  value={schedule}
                  onValueChange={(val) => setSchedule(val as string)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="How often should this run?" />
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

              {/* HTTP fields (shown only for http type) */}
              {type === "http" && (
                <>
                  {/* URL + Method */}
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

                  {/* Body (for POST/PUT) */}
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

                  {/* Timeout */}
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
                          <SelectItem key={opt.value} value={String(opt.value)}>
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
                {loading ? "Creating..." : "Create job"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* Success step */
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <DialogTitle>
                    {createdJob?.name} is scheduled
                  </DialogTitle>
                  <DialogDescription className="mt-0.5">
                    Your job will run on the defined schedule automatically.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-5 space-y-4">
              <div className="rounded-lg bg-muted/50 border border-border/50 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Schedule</span>
                  <span className="font-mono text-foreground/80">
                    {createdJob?.schedule}
                  </span>
                </div>
                {createdJob?.nextRunAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Next run</span>
                    <span className="text-foreground/80">
                      {new Date(createdJob.nextRunAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button onClick={handleDone} size="lg">
                Go to dashboard
                <ArrowRight data-icon="inline-end" className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

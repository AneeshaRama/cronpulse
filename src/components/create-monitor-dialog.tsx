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
import {
  Plus,
  Copy,
  Check,
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

const GRACE_OPTIONS = [
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "30 minutes", value: 1800 },
  { label: "1 hour", value: 3600 },
] as const;

type DialogStep = "form" | "success";

interface CreatedMonitor {
  id: string;
  name: string;
  pingUrl: string;
  schedule: string;
}

export function CreateMonitorDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<DialogStep>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createdMonitor, setCreatedMonitor] = useState<CreatedMonitor | null>(
    null
  );

  // Form state
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [customSchedule, setCustomSchedule] = useState("");
  const [gracePeriod, setGracePeriod] = useState(300);

  const effectiveSchedule = schedule === "custom" ? customSchedule : schedule;

  function resetForm() {
    setStep("form");
    setName("");
    setSchedule("");
    setCustomSchedule("");
    setGracePeriod(300);
    setError(null);
    setLoading(false);
    setCopied(false);
    setCreatedMonitor(null);
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

    setLoading(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: name.trim(),
          schedule: effectiveSchedule.trim(),
          gracePeriod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create monitor");
      }

      const monitor = await res.json();
      setCreatedMonitor(monitor);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  function getPingUrl() {
    if (!createdMonitor) return "";
    return `${baseUrl}/api/ping/${createdMonitor.pingUrl}`;
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(getPingUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            New Monitor
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg">
        {step === "form" ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create a new monitor</DialogTitle>
              <DialogDescription>
                Set up monitoring for a cron job. Once created, you&apos;ll get a
                unique URL that your job should ping on every successful run.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="monitor-name">Monitor name</Label>
                <Input
                  id="monitor-name"
                  placeholder="e.g. Database Backup, Email Queue, Log Cleanup"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name to identify this job on your dashboard.
                </p>
              </div>

              {/* Cron schedule */}
              <div className="space-y-2">
                <Label>Expected schedule</Label>
                <Select
                  value={schedule}
                  onValueChange={(val) => setSchedule(val as string)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="How often does this job run?" />
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
                <p className="text-xs text-muted-foreground">
                  Extra time to wait after a missed schedule before marking the
                  job as late. Accounts for jobs that take time to complete.
                </p>
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
                {loading ? "Creating..." : "Create monitor"}
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
                    {createdMonitor?.name} is ready
                  </DialogTitle>
                  <DialogDescription className="mt-0.5">
                    Your monitor is live and waiting for its first ping.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-5 space-y-5">
              {/* Ping URL */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Your ping URL</Label>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 px-4 py-3">
                  <code className="flex-1 text-sm font-mono text-primary break-all select-all">
                    {getPingUrl()}
                  </code>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* How to integrate */}
              <div className="space-y-3">
                <Label className="text-muted-foreground">How it works</Label>
                <div className="space-y-2.5">
                  <Step number={1}>
                    Send a <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">GET</code> or{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">POST</code> request
                    to this URL at the end of your cron job script.
                  </Step>
                  <Step number={2}>
                    CronPulse checks for pings based on your schedule
                    {createdMonitor?.schedule && (
                      <span className="font-mono text-foreground/70"> ({createdMonitor.schedule})</span>
                    )}
                    . If a ping is missed, the job is marked as{" "}
                    <span className="font-medium text-yellow-400">late</span>.
                  </Step>
                  <Step number={3}>
                    If two consecutive pings are missed, the job is marked as{" "}
                    <span className="font-medium text-red-400">down</span> and
                    you&apos;ll be alerted.
                  </Step>
                </div>
              </div>

              {/* Quick examples */}
              <div className="space-y-2.5">
                <Label className="text-muted-foreground">Quick examples</Label>
                <div className="space-y-2">
                  <CodeExample
                    label="cURL (shell script)"
                    code={`curl -fsS ${getPingUrl()}`}
                  />
                  <CodeExample
                    label="JavaScript / Node.js"
                    code={`await fetch("${getPingUrl()}")`}
                  />
                  <CodeExample
                    label="Python"
                    code={`requests.get("${getPingUrl()}")`}
                  />
                </div>
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

function Step({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary mt-0.5">
        {number}
      </span>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {children}
      </p>
    </div>
  );
}

function CodeExample({ label, code }: { label: string; code: string }) {
  return (
    <div className="rounded-lg bg-muted/30 border border-border/40 px-3.5 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground mb-1">
        {label}
      </p>
      <code className="text-xs font-mono text-foreground/80">{code}</code>
    </div>
  );
}

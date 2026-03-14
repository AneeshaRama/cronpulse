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
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface JobData {
  id: string;
  name: string;
}

export function DeleteScheduledJobDialog({ job }: { job: JobData }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");

  const confirmed = confirmation === job.name;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmation("");
      setError(null);
    }
  }

  async function handleDelete() {
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/scheduled-jobs/${job.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete job");
      }

      setOpen(false);
      const projectId = searchParams.get("projectId");
      router.push(
        projectId
          ? `/dashboard/scheduled?projectId=${projectId}`
          : "/dashboard/scheduled",
      );
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
          <Button variant="destructive" size="sm">
            <Trash2 data-icon="inline-start" className="h-3.5 w-3.5" />
            Delete
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <DialogTitle>Delete scheduled job</DialogTitle>
              <DialogDescription className="mt-0.5">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            This will permanently delete{" "}
            <strong className="text-foreground">{job.name}</strong> and all its
            execution history. The job will stop running immediately.
          </p>

          <div className="space-y-2">
            <Label
              htmlFor="delete-job-confirmation"
              className="font-normal text-muted-foreground"
            >
              Type{" "}
              <span className="font-semibold italic text-foreground">
                {job.name}
              </span>{" "}
              to confirm
            </Label>
            <Input
              id="delete-job-confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={job.name}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-5">
          <Button
            variant="destructive"
            size="lg"
            onClick={handleDelete}
            disabled={!confirmed || loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Deleting..." : "Delete job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

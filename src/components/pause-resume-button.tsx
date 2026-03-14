"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, Loader2 } from "lucide-react";

export function PauseResumeButton({
  jobId,
  currentStatus,
}: {
  jobId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);
  const isPaused = currentStatus === "paused";

  async function handleToggle() {
    setLoading(true);

    try {
      const res = await fetch(`/api/scheduled-jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: isPaused ? "active" : "paused",
        }),
      });

      if (!res.ok) throw new Error("Failed to update job");

      window.location.reload();
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 data-icon="inline-start" className="h-3.5 w-3.5 animate-spin" />
      ) : isPaused ? (
        <Play data-icon="inline-start" className="h-3.5 w-3.5" />
      ) : (
        <Pause data-icon="inline-start" className="h-3.5 w-3.5" />
      )}
      {isPaused ? "Resume" : "Pause"}
    </Button>
  );
}

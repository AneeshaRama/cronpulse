"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";

export function TriggerJobButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleTrigger() {
    setLoading(true);

    try {
      const res = await fetch(`/api/scheduled-jobs/${jobId}/trigger`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to trigger job");

      window.location.reload();
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleTrigger}
      disabled={loading}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {loading ? (
        <Loader2 data-icon="inline-start" className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Play data-icon="inline-start" className="h-3.5 w-3.5" />
      )}
      {loading ? "Running..." : "Trigger now"}
    </Button>
  );
}

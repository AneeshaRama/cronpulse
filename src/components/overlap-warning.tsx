"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { OverlapWarning } from "@/lib/monitor/detect-overlaps";

export function OverlapWarningBanner({
  warnings,
}: {
  warnings: OverlapWarning[];
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || warnings.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-400">
              Schedule overlaps detected
            </p>
            <ul className="space-y-1.5">
              {warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-300/80">
                  <span className="font-medium text-amber-300">
                    {w.monitorA.name}
                  </span>{" "}
                  <span className="font-mono text-amber-400/60">
                    ({w.monitorA.schedule})
                  </span>{" "}
                  and{" "}
                  <span className="font-medium text-amber-300">
                    {w.monitorB.name}
                  </span>{" "}
                  <span className="font-mono text-amber-400/60">
                    ({w.monitorB.schedule})
                  </span>{" "}
                  overlap {w.overlapCount} time
                  {w.overlapCount > 1 ? "s" : ""} in the next 24h.
                  {" "}Consider staggering them if they share resources.
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-amber-400/60 hover:text-amber-400 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

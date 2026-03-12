"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative rounded-lg border border-border/30 bg-[oklch(0.12_0.005_260)]">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-muted-foreground opacity-0 transition-all hover:bg-white/10 hover:text-foreground group-hover:opacity-100"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="text-foreground/80">{code}</code>
      </pre>
    </div>
  );
}

export function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-primary/20 bg-primary/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
  };

  return (
    <div
      className={`rounded-lg border p-4 text-sm text-muted-foreground ${styles[type]}`}
    >
      {children}
    </div>
  );
}

export function EndpointBlock({
  method,
  path,
  description,
  auth,
  body,
  response,
  queryParams,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth?: boolean;
  body?: string;
  response?: string;
  queryParams?: string;
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/15 text-emerald-400",
    POST: "bg-blue-500/15 text-blue-400",
    PATCH: "bg-yellow-500/15 text-yellow-400",
    DELETE: "bg-red-500/15 text-red-400",
  };

  return (
    <div className="rounded-xl border border-border/30 bg-card/20 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border/20 px-5 py-3.5">
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-bold ${methodColors[method]}`}
        >
          {method}
        </span>
        <code className="text-sm font-medium">{path}</code>
        {auth && (
          <span className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
            Auth required
          </span>
        )}
      </div>
      <div className="space-y-4 p-5">
        <p className="text-sm text-muted-foreground">{description}</p>
        {queryParams && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Query Parameters
            </p>
            <CodeBlock code={queryParams} />
          </div>
        )}
        {body && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Request Body
            </p>
            <CodeBlock code={body} />
          </div>
        )}
        {response && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Response
            </p>
            <CodeBlock code={response} />
          </div>
        )}
      </div>
    </div>
  );
}

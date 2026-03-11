"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import type { Highlighter } from "shiki";

interface Snippet {
  lang: string;
  shikiLang: string;
  label: string;
  code: string;
}

function buildSnippets(pingUrl: string): Snippet[] {
  return [
    {
      lang: "curl",
      shikiLang: "shellscript",
      label: "cURL",
      code: `curl -fsS "${pingUrl}"`,
    },
    {
      lang: "typescript",
      shikiLang: "typescript",
      label: "TypeScript",
      code: `// Add to the end of your scheduled task\nawait fetch("${pingUrl}");`,
    },
    {
      lang: "javascript",
      shikiLang: "javascript",
      label: "Node.js",
      code: `// Using native fetch (Node 18+)\nawait fetch("${pingUrl}");\n\n// Or with http module\nconst https = require("https");\nhttps.get("${pingUrl}");`,
    },
    {
      lang: "python",
      shikiLang: "python",
      label: "Python",
      code: `import requests\n\n# Add to the end of your scheduled task\nrequests.get("${pingUrl}")`,
    },
    {
      lang: "rust",
      shikiLang: "rust",
      label: "Rust",
      code: `// Using reqwest\nlet _ = reqwest::get("${pingUrl}").await;`,
    },
  ];
}

export function CodeSnippets({ pingUrl }: { pingUrl: string }) {
  const snippets = buildSnippets(pingUrl);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<
    Record<number, string>
  >({});
  const highlighterRef = useRef<Highlighter | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHighlighter() {
      const { createHighlighter } = await import("shiki");

      const highlighter = await createHighlighter({
        themes: ["vitesse-dark"],
        langs: ["shellscript", "typescript", "javascript", "python", "rust"],
      });

      if (cancelled) return;
      highlighterRef.current = highlighter;

      // Highlight all snippets at once
      const results: Record<number, string> = {};
      snippets.forEach((snippet, i) => {
        results[i] = highlighter.codeToHtml(snippet.code, {
          lang: snippet.shikiLang,
          theme: "vitesse-dark",
        });
      });

      if (!cancelled) {
        setHighlightedHtml(results);
      }
    }

    loadHighlighter();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pingUrl]);

  async function handleCopy() {
    await navigator.clipboard.writeText(snippets[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-1">
        <div className="flex">
          {snippets.map((snippet, i) => (
            <button
              key={snippet.lang}
              type="button"
              onClick={() => {
                setActiveTab(i);
                setCopied(false);
              }}
              className={`relative px-3.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === i
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {snippet.label}
              {activeTab === i && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="mr-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Code block */}
      <div className="p-4 bg-[#121212]">
        {highlightedHtml[activeTab] ? (
          <div
            className="text-sm leading-relaxed [&_pre]:!bg-transparent [&_code]:font-mono"
            dangerouslySetInnerHTML={{ __html: highlightedHtml[activeTab] }}
          />
        ) : (
          <pre className="text-sm font-mono leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {snippets[activeTab].code}
          </pre>
        )}
      </div>
    </div>
  );
}

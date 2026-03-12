import Link from "next/link";
import { Activity } from "lucide-react";
import { DocsSidebar } from "./docs-sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <Activity className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-base font-bold tracking-tight">
              CronPulse
            </span>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Docs
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex h-8 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl pt-14">
        {/* Sidebar */}
        <DocsSidebar />

        {/* Content */}
        <main className="min-w-0 flex-1 px-8 py-10 lg:px-12">{children}</main>
      </div>
    </div>
  );
}

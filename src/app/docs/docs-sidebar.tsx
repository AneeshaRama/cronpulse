"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Rocket,
  Monitor,
  Bell,
  Webhook,
  Code,
  Server,
} from "lucide-react";

const sections = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs", icon: BookOpen },
      { title: "Quick Start", href: "/docs/quick-start", icon: Rocket },
      { title: "Self-Hosting", href: "/docs/self-hosting", icon: Server },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Monitors", href: "/docs/monitors", icon: Monitor },
      { title: "Alert Channels", href: "/docs/alert-channels", icon: Bell },
      { title: "Integrations", href: "/docs/integrations", icon: Webhook },
    ],
  },
  {
    title: "API Reference",
    items: [
      { title: "API Overview", href: "/docs/api", icon: Code },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border/30 py-8 pr-4 pl-6 lg:block">
      <nav className="space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-card/40 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

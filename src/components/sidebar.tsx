"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Bell,
  Settings,
  FolderOpen,
  LogOut,
  Timer,
} from "lucide-react";
import { CreateProjectDialog } from "@/components/create-project-dialog";

interface Project {
  id: string;
  name: string;
}

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function Sidebar({
  user,
  projects,
  signOutAction,
}: {
  user: User;
  projects: Project[];
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentProjectId = searchParams.get("projectId") || projects[0]?.id;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  function navHref(path: string) {
    return currentProjectId ? `${path}?projectId=${currentProjectId}` : path;
  }

  const navItems = [
    { label: "Monitors", icon: Activity, path: "/dashboard" },
    { label: "Scheduled", icon: Timer, path: "/dashboard/scheduled" },
    { label: "Alerts", icon: Bell, path: "/dashboard/alerts" },
    { label: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 260,
        minWidth: 260,
        maxWidth: 260,
        height: "100vh",
        background: "oklch(0.12 0.005 260)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 24px 28px" }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div
            className="flex items-center justify-center rounded-xl bg-primary/10"
            style={{ width: 38, height: 38 }}
          >
            <Activity style={{ width: 20, height: 20 }} className="text-primary" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }} className="text-foreground">
            Cron<span className="text-primary">Pulse</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "0 16px" }}>
        {/* Menu section */}
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            padding: "0 12px",
            marginBottom: 8,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          MENU
        </p>

        {navItems.map((item) => {
          const isActive =
            item.path === "/dashboard"
              ? pathname === "/dashboard" || pathname.startsWith("/dashboard/monitors")
              : pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={navHref(item.path)}
              className={`flex items-center transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "hover:text-white/80"
              }`}
              style={{
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 2,
                ...(isActive ? {} : { color: "rgba(255,255,255,0.45)" }),
              }}
            >
              <item.icon style={{ width: 20, height: 20 }} />
              {item.label}
            </Link>
          );
        })}

        {/* Projects section */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "0 12px",
            marginTop: 28,
            marginBottom: 8,
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            PROJECTS
          </p>
          <CreateProjectDialog />
        </div>

        {projects.map((project) => {
          const isActive = project.id === currentProjectId;

          return (
            <Link
              key={project.id}
              href={`/dashboard?projectId=${project.id}`}
              className="flex items-center transition-colors hover:text-white/80"
              style={{
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 2,
                color: isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
              }}
            >
              <div className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
                {isActive && (
                  <div
                    className="absolute rounded-full bg-primary"
                    style={{ width: 6, height: 6, left: -14 }}
                  />
                )}
                <FolderOpen style={{ width: 20, height: 20 }} />
              </div>
              <span className="truncate">{project.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User footer */}
      <div
        style={{
          marginTop: "auto",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 20px",
        }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              className="flex items-center justify-center bg-primary/15 text-primary"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                fontSize: 13,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              className="truncate"
              style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}
            >
              {user.name}
            </p>
            <p
              className="truncate"
              style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}
            >
              {user.email}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="transition-colors hover:text-white/60"
              style={{
                padding: 6,
                borderRadius: 8,
                color: "rgba(255,255,255,0.25)",
                flexShrink: 0,
              }}
              title="Sign out"
            >
              <LogOut style={{ width: 16, height: 16 }} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

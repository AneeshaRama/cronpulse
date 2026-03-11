import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  Activity,
  Bell,
  Settings,
  FolderOpen,
  LogOut,
} from "lucide-react";
import { CreateProjectDialog } from "@/components/create-project-dialog";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id!));

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", position: "fixed", top: 0, left: 0 }}>
      {/* Sidebar */}
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

          <a
            href="/dashboard"
            className="flex items-center bg-primary/10 text-primary"
            style={{
              gap: 12,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            <Activity style={{ width: 20, height: 20 }} />
            Monitors
          </a>

          <a
            href="/dashboard/alerts"
            className="flex items-center transition-colors hover:text-white/80"
            style={{
              gap: 12,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              marginBottom: 2,
            }}
          >
            <Bell style={{ width: 20, height: 20 }} />
            Alerts
          </a>

          <a
            href="/dashboard/settings"
            className="flex items-center transition-colors hover:text-white/80"
            style={{
              gap: 12,
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              marginBottom: 2,
            }}
          >
            <Settings style={{ width: 20, height: 20 }} />
            Settings
          </a>

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

          {userProjects.map((project) => (
            <a
              key={project.id}
              href={`/dashboard?projectId=${project.id}`}
              className="flex items-center transition-colors hover:text-white/80"
              style={{
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                color: "rgba(255,255,255,0.45)",
                marginBottom: 2,
              }}
            >
              <FolderOpen style={{ width: 20, height: 20 }} />
              <span className="truncate">{project.name}</span>
            </a>
          ))}
        </div>

        {/* User footer — pinned to bottom */}
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
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/signin" });
              }}
            >
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

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}

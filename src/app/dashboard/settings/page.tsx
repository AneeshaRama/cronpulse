import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { alertChannels, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Bell, Mail, MessageSquare, Hash, Send, Webhook } from "lucide-react";
import { EmailAlertSettings } from "@/components/email-alert-settings";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { projectId } = await searchParams;

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id));

  if (userProjects.length === 0) {
    redirect("/signin");
  }

  const project =
    (projectId && userProjects.find((p) => p.id === projectId)) ||
    userProjects[0];

  // Get email alert channels for this project
  const channels = await db
    .select()
    .from(alertChannels)
    .where(eq(alertChannels.projectId, project.id));

  const emailChannels = channels
    .filter((ch) => ch.type === "email")
    .map((ch) => ({
      id: ch.id,
      email: (ch.config as { email: string }).email,
      enabled: ch.enabled,
    }));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage settings for{" "}
          <span className="text-foreground/70 font-medium">
            {project.name}
          </span>
        </p>
      </div>

      {/* Notifications section */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Choose how you want to be alerted when a monitor goes late or
              down.
            </p>
          </div>
        </div>

        <div className="space-y-4 pl-12">
          {/* Email */}
          <div className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium">Email</h3>
                <p className="text-xs text-muted-foreground">
                  Receive alerts directly in your inbox.
                </p>
              </div>
            </div>
            <EmailAlertSettings
              projectId={project.id}
              initialChannels={emailChannels}
            />
          </div>

          {/* Coming soon channels */}
          <ComingSoonChannel
            icon={MessageSquare}
            name="Slack"
            description="Post alerts to a Slack channel via webhook."
          />
          <ComingSoonChannel
            icon={Send}
            name="Telegram"
            description="Send alerts to a Telegram chat via bot."
          />
          <ComingSoonChannel
            icon={Hash}
            name="Discord"
            description="Post alerts to a Discord channel via webhook."
          />
          <ComingSoonChannel
            icon={Webhook}
            name="Custom Webhook"
            description="Send alerts to any HTTP endpoint."
          />
        </div>
      </section>
    </div>
  );
}

function ComingSoonChannel({
  icon: Icon,
  name,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card/30 px-5 py-4 opacity-50">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-medium">{name}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <span className="text-[11px] font-medium text-muted-foreground rounded-full border border-border/50 px-2.5 py-0.5">
        Coming soon
      </span>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  alertQueue,
  alertChannels,
  monitors,
  projects,
} from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { AlertHistory } from "@/components/alert-history";

const PAGE_SIZE = 5;

export default async function AlertsPage({
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

  // Get first page of alerts
  const alerts = await db
    .select({
      id: alertQueue.id,
      status: alertQueue.status,
      payload: alertQueue.payload,
      attempts: alertQueue.attempts,
      sentAt: alertQueue.sentAt,
      createdAt: alertQueue.createdAt,
      channelType: alertChannels.type,
      channelConfig: alertChannels.config,
      monitorName: monitors.name,
    })
    .from(alertQueue)
    .innerJoin(alertChannels, eq(alertQueue.alertChannelId, alertChannels.id))
    .innerJoin(monitors, eq(alertQueue.monitorId, monitors.id))
    .where(eq(alertChannels.projectId, project.id))
    .orderBy(desc(alertQueue.createdAt))
    .limit(PAGE_SIZE);

  const totalResult = await db
    .select({ total: count() })
    .from(alertQueue)
    .innerJoin(alertChannels, eq(alertQueue.alertChannelId, alertChannels.id))
    .where(eq(alertChannels.projectId, project.id))
    .then((rows) => rows[0]);

  const total = totalResult?.total ?? 0;

  const initialAlerts = alerts.map((a) => ({
    id: a.id,
    status: a.status,
    monitorName: a.monitorName,
    monitorStatus: (a.payload as { status: string }).status,
    channelType: a.channelType,
    channelConfig: a.channelConfig,
    attempts: a.attempts,
    sentAt: a.sentAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alert history for{" "}
          <span className="text-foreground/70 font-medium">
            {project.name}
          </span>
        </p>
      </div>

      {/* Alert history */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-5">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold mb-1">No alerts yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs text-center">
            Alerts will appear here when a monitor goes late or down and
            notifications are sent.
          </p>
        </div>
      ) : (
        <AlertHistory
          projectId={project.id}
          initialData={{
            alerts: initialAlerts,
            total,
            hasMore: alerts.length < total,
          }}
        />
      )}
    </div>
  );
}

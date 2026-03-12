import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { alertQueue, alertChannels, monitors, projects } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

const PAGE_SIZE = 5;

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 },
    );
  }

  // Verify project ownership
  const project = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, session.user.id)),
    )
    .then((rows) => rows[0]);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 403 });
  }

  // Get alerts with channel type and monitor name
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
    .where(eq(alertChannels.projectId, projectId))
    .orderBy(desc(alertQueue.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  // Get total count
  const totalResult = await db
    .select({ total: count() })
    .from(alertQueue)
    .innerJoin(alertChannels, eq(alertQueue.alertChannelId, alertChannels.id))
    .where(eq(alertChannels.projectId, projectId))
    .then((rows) => rows[0]);

  const total = totalResult?.total ?? 0;

  return NextResponse.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      status: a.status,
      monitorName: a.monitorName,
      monitorStatus: (a.payload as { status: string }).status,
      channelType: a.channelType,
      channelConfig: a.channelConfig,
      attempts: a.attempts,
      sentAt: a.sentAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
    total,
    hasMore: page * PAGE_SIZE < total,
  });
}

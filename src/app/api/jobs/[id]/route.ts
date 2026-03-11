import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { monitors, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateMonitorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  schedule: z.string().min(1).optional(),
  gracePeriod: z.number().int().min(60).max(86400).optional(),
});

async function getAuthorizedMonitor(monitorId: string, userId: string) {
  const result = await db
    .select({
      monitor: monitors,
      project: projects,
    })
    .from(monitors)
    .innerJoin(projects, eq(monitors.projectId, projects.id))
    .where(and(eq(monitors.id, monitorId), eq(projects.userId, userId)))
    .then((rows) => rows[0]);

  return result?.monitor ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const monitor = await getAuthorizedMonitor(id, session.user.id);

  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  return NextResponse.json(monitor);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const monitor = await getAuthorizedMonitor(id, session.user.id);

  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateMonitorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await db
    .update(monitors)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(monitors.id, id))
    .returning();

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const monitor = await getAuthorizedMonitor(id, session.user.id);

  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  await db.delete(monitors).where(eq(monitors.id, id));

  return NextResponse.json({ message: "Monitor deleted" });
}

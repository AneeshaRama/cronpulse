import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { monitors, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createMonitorSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  schedule: z.string().min(1, "Schedule is required"),
  gracePeriod: z.number().int().min(60).max(86400).default(300),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createMonitorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { projectId, name, schedule, gracePeriod } = parsed.data;

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

  const monitor = await db
    .insert(monitors)
    .values({
      projectId,
      name,
      schedule,
      gracePeriod,
    })
    .returning();

  return NextResponse.json(monitor[0], { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query parameter is required" },
      { status: 400 },
    );
  }

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

  const jobList = await db
    .select()
    .from(monitors)
    .where(eq(monitors.projectId, projectId));

  return NextResponse.json(jobList);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduledJobs, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { parseExpression } from "cron-parser";

const updateScheduledJobSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  schedule: z.string().min(1).optional(),
  type: z.enum(["http", "reminder"]).optional(),
  httpUrl: z.string().url("Invalid URL").optional(),
  httpMethod: z.enum(["GET", "POST", "PUT", "DELETE"]).optional(),
  httpHeaders: z.record(z.string(), z.string()).optional(),
  httpBody: z.string().optional(),
  timeoutMs: z.number().int().min(1000).max(60000).optional(),
  status: z.enum(["active", "paused"]).optional(),
});

async function getAuthorizedJob(jobId: string, userId: string) {
  const result = await db
    .select({
      job: scheduledJobs,
      project: projects,
    })
    .from(scheduledJobs)
    .innerJoin(projects, eq(scheduledJobs.projectId, projects.id))
    .where(and(eq(scheduledJobs.id, jobId), eq(projects.userId, userId)))
    .then((rows) => rows[0]);

  return result?.job ?? null;
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
  const job = await getAuthorizedJob(id, session.user.id);

  if (!job) {
    return NextResponse.json({ error: "Scheduled job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
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
  const job = await getAuthorizedJob(id, session.user.id);

  if (!job) {
    return NextResponse.json({ error: "Scheduled job not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateScheduledJobSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updateData: Record<string, unknown> = {
    ...parsed.data,
    updatedAt: new Date(),
  };

  // Recompute nextRunAt if schedule changed
  if (parsed.data.schedule) {
    try {
      const interval = parseExpression(parsed.data.schedule, {
        currentDate: new Date(),
        tz: "UTC",
      });
      updateData.nextRunAt = interval.next().toDate();
    } catch {
      return NextResponse.json(
        { error: "Invalid cron expression" },
        { status: 400 },
      );
    }
  }

  const updated = await db
    .update(scheduledJobs)
    .set(updateData)
    .where(eq(scheduledJobs.id, id))
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
  const job = await getAuthorizedJob(id, session.user.id);

  if (!job) {
    return NextResponse.json({ error: "Scheduled job not found" }, { status: 404 });
  }

  await db.delete(scheduledJobs).where(eq(scheduledJobs.id, id));

  return NextResponse.json({ message: "Scheduled job deleted" });
}

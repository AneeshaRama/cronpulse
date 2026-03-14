import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduledJobs, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { executeJob } from "@/lib/scheduler/execute";

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

export async function POST(
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

  await executeJob(job);

  return NextResponse.json({ message: "Job triggered successfully" });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { monitors, pings, projects } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

const PAGE_SIZE = 5;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const result = await db
    .select({ monitorId: monitors.id })
    .from(monitors)
    .innerJoin(projects, eq(monitors.projectId, projects.id))
    .where(and(eq(monitors.id, id), eq(projects.userId, session.user.id)))
    .then((rows) => rows[0]);

  if (!result) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [pingRows, totalResult] = await Promise.all([
    db
      .select()
      .from(pings)
      .where(eq(pings.monitorId, id))
      .orderBy(desc(pings.pingedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(pings)
      .where(eq(pings.monitorId, id))
      .then((rows) => rows[0]),
  ]);

  const total = totalResult?.total ?? 0;

  return NextResponse.json({
    pings: pingRows,
    total,
    page,
    pageSize: PAGE_SIZE,
    hasMore: offset + pingRows.length < total,
  });
}

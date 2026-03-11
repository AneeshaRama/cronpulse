import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monitors, pings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pingUrl: string }> },
) {
  const { pingUrl } = await params;

  const monitor = await db
    .select()
    .from(monitors)
    .where(eq(monitors.pingUrl, pingUrl))
    .then((rows) => rows[0]);

  if (!monitor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();

  // Rate limit: 1 ping per second per monitor
  if (monitor.lastPingAt) {
    const elapsed = now.getTime() - monitor.lastPingAt.getTime();
    if (elapsed < 1000) {
      return NextResponse.json(
        { error: "Rate limited — 1 ping per second" },
        { status: 429 },
      );
    }
  }

  // Store the ping and update the monitor in parallel
  await Promise.all([
    db.insert(pings).values({
      monitorId: monitor.id,
      pingedAt: now,
    }),
    db
      .update(monitors)
      .set({
        lastPingAt: now,
        status: "healthy",
        updatedAt: now,
      })
      .where(eq(monitors.id, monitor.id)),
  ]);

  return NextResponse.json({ status: "ok" });
}

// Support both GET and POST for flexibility
export const POST = GET;

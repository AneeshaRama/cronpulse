import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { alertChannels, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function getAuthorizedChannel(channelId: string, userId: string) {
  const result = await db
    .select({
      channel: alertChannels,
      project: projects,
    })
    .from(alertChannels)
    .innerJoin(projects, eq(alertChannels.projectId, projects.id))
    .where(
      and(eq(alertChannels.id, channelId), eq(projects.userId, userId)),
    )
    .then((rows) => rows[0]);

  return result?.channel ?? null;
}

// Toggle enabled/disabled
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const channel = await getAuthorizedChannel(id, session.user.id);

  if (!channel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const enabled = typeof body.enabled === "boolean" ? body.enabled : channel.enabled;

  const updated = await db
    .update(alertChannels)
    .set({
      enabled,
      updatedAt: new Date(),
    })
    .where(eq(alertChannels.id, id))
    .returning()
    .then((rows) => rows[0]);

  return NextResponse.json(updated);
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
  const channel = await getAuthorizedChannel(id, session.user.id);

  if (!channel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(alertChannels).where(eq(alertChannels.id, id));

  return NextResponse.json({ message: "Alert channel deleted" });
}

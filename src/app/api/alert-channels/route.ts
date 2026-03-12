import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { alertChannels, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createChannelSchema = z.object({
  projectId: z.string().min(1),
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createChannelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // Verify project ownership
  const project = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, parsed.data.projectId),
        eq(projects.userId, session.user.id),
      ),
    )
    .then((rows) => rows[0]);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 403 });
  }

  // Check for duplicate email in same project
  const existing = await db
    .select()
    .from(alertChannels)
    .where(
      and(
        eq(alertChannels.projectId, project.id),
        eq(alertChannels.type, "email"),
      ),
    );

  const duplicate = existing.find(
    (ch) => (ch.config as { email: string }).email === parsed.data.email,
  );

  if (duplicate) {
    return NextResponse.json(
      { error: "This email is already configured" },
      { status: 409 },
    );
  }

  const channel = await db
    .insert(alertChannels)
    .values({
      projectId: project.id,
      type: "email",
      config: { email: parsed.data.email },
    })
    .returning()
    .then((rows) => rows[0]);

  return NextResponse.json(channel, { status: 201 });
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

  const channels = await db
    .select()
    .from(alertChannels)
    .where(eq(alertChannels.projectId, projectId));

  return NextResponse.json(channels);
}

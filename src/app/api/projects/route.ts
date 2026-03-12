import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, alertChannels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const project = await db
    .insert(projects)
    .values({
      userId: session.user.id,
      name: parsed.data.name,
    })
    .returning()
    .then((rows) => rows[0]);

  // Auto-add user's email as default alert channel
  if (session.user.email) {
    await db.insert(alertChannels).values({
      projectId: project.id,
      type: "email",
      config: { email: session.user.email },
    });
  }

  return NextResponse.json(project, { status: 201 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id));

  return NextResponse.json(userProjects);
}

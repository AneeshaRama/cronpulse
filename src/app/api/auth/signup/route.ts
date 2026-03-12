import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, projects, alertChannels } from "@/lib/db/schema";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  // Check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .then((rows) => rows[0]);

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
    })
    .returning()
    .then((rows) => rows[0]);

  // Auto-create default project and email alert channel
  const project = await db
    .insert(projects)
    .values({
      userId: user.id,
      name: "My Project",
    })
    .returning()
    .then((rows) => rows[0]);

  if (project) {
    await db.insert(alertChannels).values({
      projectId: project.id,
      type: "email",
      config: { email },
    });
  }

  return NextResponse.json({ success: true });
}

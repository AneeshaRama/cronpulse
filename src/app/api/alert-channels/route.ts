import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { alertChannels, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const channelSchemas = {
  email: z.object({
    type: z.literal("email"),
    projectId: z.string().min(1),
    email: z.string().email("Invalid email address"),
  }),
  discord: z.object({
    type: z.literal("discord"),
    projectId: z.string().min(1),
    webhookUrl: z.string().url().startsWith("https://discord.com/api/webhooks/", "Must be a Discord webhook URL"),
  }),
  slack: z.object({
    type: z.literal("slack"),
    projectId: z.string().min(1),
    webhookUrl: z.string().url().startsWith("https://hooks.slack.com/", "Must be a Slack webhook URL"),
  }),
  telegram: z.object({
    type: z.literal("telegram"),
    projectId: z.string().min(1),
    botToken: z.string().min(1, "Bot token is required"),
    chatId: z.string().min(1, "Chat ID is required"),
  }),
  webhook: z.object({
    type: z.literal("webhook"),
    projectId: z.string().min(1),
    url: z.string().url("Must be a valid URL"),
    label: z.string().max(50).optional(),
  }),
};

const createChannelSchema = z.discriminatedUnion("type", [
  channelSchemas.email,
  channelSchemas.discord,
  channelSchemas.slack,
  channelSchemas.telegram,
  channelSchemas.webhook,
]);

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

  const { type, projectId } = parsed.data;

  // Verify project ownership
  const project = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, session.user.id),
      ),
    )
    .then((rows) => rows[0]);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 403 });
  }

  // Check for duplicates within same type
  const existing = await db
    .select()
    .from(alertChannels)
    .where(
      and(
        eq(alertChannels.projectId, project.id),
        eq(alertChannels.type, type),
      ),
    );

  // Build config and check duplicates based on type
  let config: Record<string, string>;

  const d = parsed.data;

  switch (d.type) {
    case "email": {
      config = { email: d.email };
      const duplicate = existing.find(
        (ch) => (ch.config as { email: string }).email === d.email,
      );
      if (duplicate) {
        return NextResponse.json(
          { error: "This email is already configured" },
          { status: 409 },
        );
      }
      break;
    }
    case "discord": {
      config = { webhookUrl: d.webhookUrl };
      const duplicate = existing.find(
        (ch) =>
          (ch.config as { webhookUrl: string }).webhookUrl === d.webhookUrl,
      );
      if (duplicate) {
        return NextResponse.json(
          { error: "This Discord webhook is already configured" },
          { status: 409 },
        );
      }
      break;
    }
    case "slack": {
      config = { webhookUrl: d.webhookUrl };
      const duplicate = existing.find(
        (ch) =>
          (ch.config as { webhookUrl: string }).webhookUrl === d.webhookUrl,
      );
      if (duplicate) {
        return NextResponse.json(
          { error: "This Slack webhook is already configured" },
          { status: 409 },
        );
      }
      break;
    }
    case "telegram": {
      config = { botToken: d.botToken, chatId: d.chatId };
      const duplicate = existing.find(
        (ch) => (ch.config as { chatId: string }).chatId === d.chatId,
      );
      if (duplicate) {
        return NextResponse.json(
          { error: "This Telegram chat is already configured" },
          { status: 409 },
        );
      }
      break;
    }
    case "webhook": {
      config = { url: d.url };
      if (d.label) config.label = d.label;
      const duplicate = existing.find(
        (ch) => (ch.config as { url: string }).url === d.url,
      );
      if (duplicate) {
        return NextResponse.json(
          { error: "This webhook URL is already configured" },
          { status: 409 },
        );
      }
      break;
    }
  }

  const channel = await db
    .insert(alertChannels)
    .values({
      projectId: project.id,
      type,
      config,
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

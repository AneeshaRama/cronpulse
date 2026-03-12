import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { alertChannels, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Bell, Mail, Webhook } from "lucide-react";
import { SlackIcon, DiscordIcon, TelegramIcon } from "@/components/icons";
import { EmailAlertSettings } from "@/components/email-alert-settings";
import { SlackAlertSettings } from "@/components/slack-alert-settings";
import { TelegramAlertSettings } from "@/components/telegram-alert-settings";
import { DiscordAlertSettings } from "@/components/discord-alert-settings";
import { WebhookAlertSettings } from "@/components/webhook-alert-settings";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { projectId } = await searchParams;

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id));

  if (userProjects.length === 0) {
    redirect("/signin");
  }

  const project =
    (projectId && userProjects.find((p) => p.id === projectId)) ||
    userProjects[0];

  // Get all alert channels for this project
  const channels = await db
    .select()
    .from(alertChannels)
    .where(eq(alertChannels.projectId, project.id));

  const emailChannels = channels
    .filter((ch) => ch.type === "email")
    .map((ch) => ({
      id: ch.id,
      email: (ch.config as { email: string }).email,
      enabled: ch.enabled,
    }));

  const slackChannels = channels
    .filter((ch) => ch.type === "slack")
    .map((ch) => ({
      id: ch.id,
      webhookUrl: (ch.config as { webhookUrl: string }).webhookUrl,
      enabled: ch.enabled,
    }));

  const discordChannels = channels
    .filter((ch) => ch.type === "discord")
    .map((ch) => ({
      id: ch.id,
      webhookUrl: (ch.config as { webhookUrl: string }).webhookUrl,
      enabled: ch.enabled,
    }));

  const telegramChannels = channels
    .filter((ch) => ch.type === "telegram")
    .map((ch) => ({
      id: ch.id,
      chatId: (ch.config as { chatId: string }).chatId,
      enabled: ch.enabled,
    }));

  const webhookChannels = channels
    .filter((ch) => ch.type === "webhook")
    .map((ch) => {
      const config = ch.config as { url: string; label?: string };
      return {
        id: ch.id,
        url: config.url,
        label: config.label,
        enabled: ch.enabled,
      };
    });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage settings for{" "}
          <span className="text-foreground/70 font-medium">
            {project.name}
          </span>
        </p>
      </div>

      {/* Notifications section */}
      <section className="space-y-5">
        <div className="flex items-center gap-2.5">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notifications
          </h2>
        </div>

        {/* Email */}
        <ChannelCard
          icon={<Mail className="h-4 w-4" />}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
          name="Email"
          description="Receive alerts directly in your inbox."
          count={emailChannels.length}
        >
          <EmailAlertSettings
            projectId={project.id}
            initialChannels={emailChannels}
          />
        </ChannelCard>

        {/* Slack */}
        <ChannelCard
          icon={<SlackIcon className="h-4 w-4" />}
          iconBg="bg-[#4A154B]/15"
          iconColor="text-[#E01E5A]"
          name="Slack"
          description="Post alerts to a Slack channel via incoming webhook."
          hint="Create an Incoming Webhook in your Slack workspace settings."
          count={slackChannels.length}
        >
          <SlackAlertSettings
            projectId={project.id}
            initialChannels={slackChannels}
          />
        </ChannelCard>

        {/* Discord */}
        <ChannelCard
          icon={<DiscordIcon className="h-4 w-4" />}
          iconBg="bg-[#5865F2]/15"
          iconColor="text-[#5865F2]"
          name="Discord"
          description="Post alerts to a Discord channel via webhook."
          hint="Channel Settings &rarr; Integrations &rarr; Create Webhook."
          count={discordChannels.length}
        >
          <DiscordAlertSettings
            projectId={project.id}
            initialChannels={discordChannels}
          />
        </ChannelCard>

        {/* Telegram */}
        <ChannelCard
          icon={<TelegramIcon className="h-4 w-4" />}
          iconBg="bg-[#26A5E4]/15"
          iconColor="text-[#26A5E4]"
          name="Telegram"
          description="Send alerts to a Telegram chat via bot."
          hint="You'll need a bot token from @BotFather and a chat ID."
          count={telegramChannels.length}
        >
          <TelegramAlertSettings
            projectId={project.id}
            initialChannels={telegramChannels}
          />
        </ChannelCard>

        {/* Custom Webhook */}
        <ChannelCard
          icon={<Webhook className="h-4 w-4" />}
          iconBg="bg-foreground/5"
          iconColor="text-foreground/70"
          name="Custom Webhook"
          description="POST a JSON payload to any HTTP endpoint on every alert."
          count={webhookChannels.length}
        >
          <WebhookAlertSettings
            projectId={project.id}
            initialChannels={webhookChannels}
          />
        </ChannelCard>
      </section>
    </div>
  );
}

function ChannelCard({
  icon,
  iconBg,
  iconColor,
  name,
  description,
  hint,
  count,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  name: string;
  description: string;
  hint?: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/30">
      {/* Header */}
      <div className="flex items-start gap-3.5 px-5 pt-5 pb-4">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{name}</h3>
            {count > 0 && (
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 rounded-full px-1.5 py-px">
                {count}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
            {description}
            {hint && (
              <span
                className="text-muted-foreground/50"
                dangerouslySetInnerHTML={{ __html: ` ${hint}` }}
              />
            )}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-border/30" />

      {/* Content */}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

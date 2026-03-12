import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CronPulse",
  description:
    "The open source platform for cron jobs — monitor your existing cron jobs and get alerted on Discord, Slack, Telegram, and email when something goes wrong.",
  openGraph: {
    title: "CronPulse",
    description:
      "The open source platform for cron jobs — monitor your existing cron jobs and get alerted when something goes wrong.",
    siteName: "CronPulse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CronPulse",
    description:
      "The open source platform for cron jobs — monitor your existing cron jobs and get alerted when something goes wrong.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} h-full font-sans antialiased`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}

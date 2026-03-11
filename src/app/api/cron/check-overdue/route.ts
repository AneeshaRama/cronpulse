import { NextResponse } from "next/server";
import { checkOverdueMonitors } from "@/lib/monitor/check-overdue";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await checkOverdueMonitors();

  return NextResponse.json({ status: "ok" });
}

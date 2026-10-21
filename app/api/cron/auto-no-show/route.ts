import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nowInLagos } from "@/lib/time";

export const dynamic = "force-dynamic";

/**
 * Staff mark a confirmed appointment "completed" when the patient is
 * actually seen; this route is what moves the rest to "no-show" once it's
 * no longer possible for that to happen. Runs once a day (see vercel.json)
 * and sweeps every "confirmed" appointment from a date before today --
 * anything still confirmed by the morning after its date was never
 * completed, so it's a no-show. Only fully past days are swept, not "today
 * so far," so staff keep the whole clinic day to check patients in before
 * anything is auto-flagged.
 *
 * Protected by CRON_SECRET the same way as the other cron routes.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { date: today } = nowInLagos();

  const { data, error } = await admin
    .from("appointments")
    .update({ status: "no-show" })
    .eq("status", "confirmed")
    .lt("appointment_date", today)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ markedNoShow: data?.length ?? 0 });
}

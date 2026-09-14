import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Production reminder runner: queue due reminders, then dispatch browser push jobs.
function assertCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret) throw new Error("CRON_SECRET is not configured");
  if (auth !== `Bearer ${secret}`) throw new Error("Unauthorized");
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is incomplete");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown reminder notification error";
  }
}

export async function GET(req: Request) {
  try {
    assertCron(req);
    const supabase = adminClient();

    const { data: queued, error: queueError } = await supabase.rpc(
      "enqueue_due_reminders"
    );
    if (queueError) throw queueError;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase server configuration is incomplete");
    }

    const pushResponse = await fetch(
      `${supabaseUrl}/functions/v1/push-sender`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: "vercel-cron" }),
      }
    );

    const pushText = await pushResponse.text();
    let pushResult: unknown = pushText;
    try {
      pushResult = JSON.parse(pushText);
    } catch {
      // Keep the raw provider response for diagnostics.
    }

    if (!pushResponse.ok) {
      throw new Error(
        `push-sender returned ${pushResponse.status}: ${typeof pushResult === "string" ? pushResult.slice(0, 500) : JSON.stringify(pushResult).slice(0, 500)}`
      );
    }

    return NextResponse.json({
      ok: true,
      queued,
      push: pushResult,
    });
  } catch (error) {
    const message = errorMessage(error);
    console.error("reminder notification cron failed", { message });
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === "Unauthorized" ? 401 : 500 }
    );
  }
}

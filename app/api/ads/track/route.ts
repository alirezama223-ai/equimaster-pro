import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const events = new Set(["impression", "click"]);

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is incomplete");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adId = typeof body?.adId === "string" ? body.adId : "";
    const event = typeof body?.event === "string" ? body.event : "";

    if (!adId || !events.has(event)) {
      return NextResponse.json({ ok: false, error: "Invalid tracking payload." }, { status: 400 });
    }

    const supabase = serviceClient();
    const functionName = event === "click" ? "track_ad_click" : "track_ad_impression";
    const { data, error } = await supabase.rpc(functionName, { p_ad_id: adId });

    if (error) {
      console.error("advertisement tracking failed", { event, adId, error: error.message });
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: data === true });
  } catch (error) {
    console.error("advertisement tracking request failed", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

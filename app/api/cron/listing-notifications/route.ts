import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is incomplete");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function assertCron(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const workerToken = process.env.NOTIFICATION_WORKER_TOKEN;
  const auth = req.headers.get("authorization");
  const internalToken = req.headers.get("x-notification-worker-token");

  if (cronSecret && auth === `Bearer ${cronSecret}`) return;
  if (workerToken && internalToken === workerToken) return;
  if (cronSecret || workerToken) throw new Error("Unauthorized");
}

function eventCopy(event: string, name: string, reason?: string | null) {
  if (event === "submitted") {
    return {
      subject: `We received your listing – ${name}`,
      title: "Listing received",
      body: `Your listing “${name}” was received successfully and is now under review. We usually review listings within 24 hours. We’ll notify you when it is approved and published.`,
      sms: `EquiMaster Pro: Your listing “${name}” was received and is under review. We usually review listings within 24 hours.`,
    };
  }
  if (event === "published") {
    return {
      subject: `Your listing is now live – ${name}`,
      title: "Listing published",
      body: `Good news! Your listing “${name}” has been approved and published on EquiMaster Pro.`,
      sms: `EquiMaster Pro: Your listing “${name}” has been approved and published.`,
    };
  }
  return {
    subject: `Update on your listing – ${name}`,
    title: "Listing rejected",
    body: `Your listing “${name}” was not approved for publication.${reason ? ` Reason: ${reason}` : " Please review the listing and contact support if you need help."}`,
    sms: `EquiMaster Pro: Your listing “${name}” was not approved.${reason ? ` Reason: ${reason}` : " Please review your listing."}`,
  };
}

async function sendEmail(to: string, subject: string, body: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><p>${body.replaceAll("\n", "<br/>")}</p><p>EquiMaster Pro</p></div>`,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Email provider returned ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
  }
  return true;
}

async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return false;
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`SMS provider returned ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
  }
  return true;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown notification worker error";
  }
}

export async function GET(req: Request) {
  try {
    assertCron(req);
    const supabase = adminClient();
    const { data: jobs, error } = await supabase
      .from("listing_notification_jobs")
      .select("id, listing_id, listing_kind, user_id, event_type, reason, attempts")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) throw error;

    let processed = 0;
    for (const job of jobs ?? []) {
      const { data: claimed, error: claimError } = await supabase
        .from("listing_notification_jobs")
        .update({ status: "processing", attempts: (job.attempts ?? 0) + 1, last_error: null })
        .eq("id", job.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) continue;

      try {
        let name = "your listing";
        let email: string | null = null;
        let phone: string | null = null;

        if (job.listing_kind === "horse_sale") {
          const { data, error: listingError } = await supabase
            .from("horse_listings")
            .select("name, seller_email, seller_phone")
            .eq("id", job.listing_id)
            .maybeSingle();
          if (listingError) throw listingError;
          name = data?.name || name;
          email = data?.seller_email || null;
          phone = data?.seller_phone || null;
        } else {
          const { data, error: listingError } = await supabase
            .from("equimarket_listings")
            .select("title")
            .eq("id", job.listing_id)
            .maybeSingle();
          if (listingError) throw listingError;
          name = data?.title || name;
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(job.user_id);
          if (authError) throw authError;
          email = authUser.user?.email ?? null;
          phone = authUser.user?.phone ?? null;
        }

        const copy = eventCopy(job.event_type, name, job.reason);
        let delivered = false;
        if (email) delivered = (await sendEmail(email, copy.subject, copy.body)) || delivered;
        if (phone) delivered = (await sendSms(phone, copy.sms)) || delivered;

        const inAppType = job.event_type === "submitted" ? "listing_submitted" : job.event_type === "published" ? "listing_published" : "listing_rejected";
        const { error: notificationError } = await supabase.from("notifications").insert({
          user_id: job.user_id,
          type: inAppType,
          title: copy.title,
          body: copy.body,
          entity_id: job.listing_id,
        });
        if (notificationError) throw notificationError;

        if (!delivered && !email && !phone) throw new Error("No email or phone is available for this listing owner");
        if (!delivered) throw new Error("No notification provider is configured for the available contact channel");

        const { error: sentError } = await supabase.from("listing_notification_jobs").update({ status: "sent", processed_at: new Date().toISOString() }).eq("id", job.id);
        if (sentError) throw sentError;
        processed += 1;
      } catch (jobError) {
        const message = errorMessage(jobError);
        console.error("listing notification job failed", { jobId: job.id, message });
        await supabase.from("listing_notification_jobs").update({ status: "failed", last_error: message }).eq("id", job.id);
      }
    }

    return NextResponse.json({ ok: true, processed, queued: jobs?.length ?? 0 });
  } catch (error) {
    const message = errorMessage(error);
    console.error("listing notification worker failed", { message });
    return NextResponse.json({ ok: false, error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

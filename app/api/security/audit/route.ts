import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import {
  getRequestAuditContext,
  recordSecurityAuditEvent,
} from "@/app/lib/security/audit";

export const runtime = "nodejs";

const CLIENT_AUDIT_EVENTS = new Set([
  "auth.login.success",
  "auth.logout",
  "auth.password_change.success",
  "auth.mfa.enroll.success",
  "auth.mfa.verify.success",
  "auth.mfa.unenroll.success",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { eventType?: unknown };
    const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";

    if (!CLIENT_AUDIT_EVENTS.has(eventType)) {
      return NextResponse.json({ error: "Unsupported audit event." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await recordSecurityAuditEvent({
      eventType,
      severity: "info",
      actorUserId: user.id,
      ...getRequestAuditContext(request),
    });

    return NextResponse.json({ recorded: true });
  } catch (error) {
    console.error("[security-audit] Failed to record event:", error);
    return NextResponse.json({ error: "Unable to record audit event." }, { status: 500 });
  }
}

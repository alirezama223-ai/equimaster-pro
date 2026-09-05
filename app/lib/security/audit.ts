import { createServiceClient } from "@/app/lib/supabase/service";

export type SecurityAuditSeverity = "info" | "warning" | "critical";

export type SecurityAuditEvent = {
  eventType: string;
  severity?: SecurityAuditSeverity;
  actorUserId?: string | null;
  targetUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Server-only audit writer. The underlying table is inaccessible to anon/authenticated
 * database roles, so security events must be written through the service role.
 */
export async function recordSecurityAuditEvent(input: SecurityAuditEvent) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("security_audit_events").insert({
    event_type: input.eventType,
    severity: input.severity ?? "info",
    actor_user_id: input.actorUserId ?? null,
    target_user_id: input.targetUserId ?? null,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
    request_id: input.requestId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`Unable to record security audit event: ${error.message}`);
  }
}

export function getRequestAuditContext(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = (forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || null) ?? null;

  return {
    ipAddress,
    userAgent: request.headers.get("user-agent"),
    requestId:
      request.headers.get("x-vercel-id") || request.headers.get("x-request-id") || null,
  };
}

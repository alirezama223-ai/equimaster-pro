import { createServiceClient } from "@/app/lib/supabase/service";
import SecurityLogsTable from "@/app/components/admin/SecurityLogsTable";

export const dynamic = "force-dynamic";

export default async function SecurityLogsPage() {
  const supabase = createServiceClient();
  const { data: events, error } = await supabase
    .from("security_audit_events")
    .select(
      "id, created_at, event_type, severity, actor_user_id, target_user_id, ip_address, user_agent, request_id, metadata"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Security
        </p>
        <h2 className="mt-1 text-3xl font-black text-white">Security Logs</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
          Recent security audit events. Credentials, access tokens, and CAPTCHA secrets are never stored here.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          Unable to load security logs.
        </div>
      ) : null}

      {!error && (events?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-gray-400">
          No security events have been recorded yet. A successful login will create the first entry.
        </div>
      ) : null}

      {!error && events && events.length > 0 ? (
        <SecurityLogsTable events={events} />
      ) : null}
    </section>
  );
}

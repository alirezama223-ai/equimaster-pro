import { createServiceClient } from "@/app/lib/supabase/service";

export const dynamic = "force-dynamic";

const severityClass: Record<string, string> = {
  info: "border-blue-400/20 bg-blue-400/10 text-blue-200",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  critical: "border-red-400/20 bg-red-400/10 text-red-200",
};

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
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">User Agent</th>
                  <th className="px-4 py-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.map((event) => (
                  <tr key={event.id} className="align-top hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 font-semibold text-white">{event.event_type}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          severityClass[event.severity] ?? severityClass.info
                        }`}
                      >
                        {event.severity}
                      </span>
                    </td>
                    <td className="max-w-56 break-all px-4 py-4 font-mono text-xs text-gray-400">
                      {event.actor_user_id ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-gray-400">
                      {event.ip_address ?? "—"}
                    </td>
                    <td className="max-w-80 px-4 py-4 text-xs leading-5 text-gray-400">
                      {event.user_agent ?? "—"}
                    </td>
                    <td className="max-w-96 px-4 py-4">
                      <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/20 p-3 text-xs leading-5 text-gray-400">
                        {JSON.stringify(event.metadata ?? {}, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

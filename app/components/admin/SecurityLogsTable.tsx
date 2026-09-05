"use client";

import { useMemo } from "react";

type SecurityEvent = {
  id: string;
  created_at: string;
  event_type: string;
  severity: string;
  actor_user_id: string | null;
  target_user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  metadata: unknown;
};

const severityClass: Record<string, string> = {
  info: "border-blue-400/20 bg-blue-400/10 text-blue-200",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  critical: "border-red-400/20 bg-red-400/10 text-red-200",
};

export default function SecurityLogsTable({ events }: { events: SecurityEvent[] }) {
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "medium",
        timeZone,
      }),
    [timeZone]
  );

  return (
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
                  {formatter.format(new Date(event.created_at))}
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
      <p className="border-t border-white/5 px-4 py-3 text-xs text-gray-500">
        Times are displayed in your browser&apos;s local time zone ({timeZone}).
      </p>
    </div>
  );
}

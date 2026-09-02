"use client";

import { useMemo, useState } from "react";

type ReportAd = {
  id: string;
  title: string;
  advertiser_name: string;
  placement: string;
  status: string;
  priority: number;
  start_at: string;
  end_at: string;
  impressions: number;
  clicks: number;
};

const placements = ["all", "homepage_top", "homepage_featured", "homepage_bottom"] as const;
const statuses = ["all", "active", "scheduled", "paused", "expired", "rejected", "draft", "pending"] as const;

type PlacementFilter = (typeof placements)[number];
type StatusFilter = (typeof statuses)[number];

function ctr(impressions: number, clicks: number) {
  return impressions > 0 ? `${((clicks / impressions) * 100).toFixed(2)}%` : "0.00%";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function inCampaignPeriod(ad: ReportAd, from: string, to: string) {
  const start = new Date(ad.start_at).getTime();
  const end = new Date(ad.end_at).getTime();
  if (from && end < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && start > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
}

export default function AdvertisementReporting({ advertisements }: { advertisements: ReportAd[] }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [placement, setPlacement] = useState<PlacementFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"performance" | "impressions" | "clicks" | "ctr">("performance");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return advertisements.filter((ad) => {
      if (status !== "all" && ad.status !== status) return false;
      if (placement !== "all" && ad.placement !== placement) return false;
      if (!inCampaignPeriod(ad, from, to)) return false;
      if (normalizedQuery && !`${ad.title} ${ad.advertiser_name}`.toLowerCase().includes(normalizedQuery)) return false;
      return true;
    });
  }, [advertisements, from, placement, query, status, to]);

  const totals = filtered.reduce(
    (acc, ad) => ({
      impressions: acc.impressions + (ad.impressions || 0),
      clicks: acc.clicks + (ad.clicks || 0),
    }),
    { impressions: 0, clicks: 0 },
  );

  const active = filtered.filter((ad) => ad.status === "active").length;
  const scheduled = filtered.filter((ad) => ad.status === "scheduled").length;
  const paused = filtered.filter((ad) => ad.status === "paused").length;
  const expired = filtered.filter((ad) => ad.status === "expired").length;

  const placementStats = ["homepage_top", "homepage_featured", "homepage_bottom"].map((value) => {
    const ads = filtered.filter((ad) => ad.placement === value);
    return {
      placement: value,
      campaigns: ads.length,
      impressions: ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0),
      clicks: ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0),
    };
  });

  const ranked = [...filtered].sort((a, b) => {
    const aCtr = a.impressions ? a.clicks / a.impressions : 0;
    const bCtr = b.impressions ? b.clicks / b.impressions : 0;
    if (sort === "impressions") return (b.impressions - a.impressions) || (b.clicks - a.clicks);
    if (sort === "clicks") return (b.clicks - a.clicks) || (bCtr - aCtr);
    if (sort === "ctr") return (bCtr - aCtr) || (b.clicks - a.clicks);
    return (b.clicks - a.clicks) || (bCtr - aCtr) || (b.impressions - a.impressions);
  });

  const topCampaign = ranked[0];

  function resetFilters() {
    setStatus("all");
    setPlacement("all");
    setFrom("");
    setTo("");
    setQuery("");
    setSort("performance");
  }

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-[#111827] p-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Campaign reporting</h2>
          <p className="mt-1 text-sm text-gray-400">Live aggregate performance from recorded advertisement impressions and clicks.</p>
        </div>
        <div className="text-xs text-gray-500">Showing {filtered.length} of {advertisements.length} campaigns</div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#081223] p-4 md:grid-cols-2 xl:grid-cols-6">
        <label className="space-y-1 text-xs text-gray-500">Status<select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm text-white outline-none"><option value="all">All statuses</option>{statuses.filter((value) => value !== "all").map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="space-y-1 text-xs text-gray-500">Placement<select value={placement} onChange={(e) => setPlacement(e.target.value as PlacementFilter)} className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm text-white outline-none"><option value="all">All placements</option>{placements.filter((value) => value !== "all").map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="space-y-1 text-xs text-gray-500">Campaign period from<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm text-white outline-none" /></label>
        <label className="space-y-1 text-xs text-gray-500">Campaign period to<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm text-white outline-none" /></label>
        <label className="space-y-1 text-xs text-gray-500">Search<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Campaign or advertiser" className="w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none" /></label>
        <div className="flex items-end"><button type="button" onClick={resetFilters} className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/5">Reset filters</button></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-[#081223] p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Campaigns</p><p className="mt-2 text-2xl font-bold text-white">{filtered.length}</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#081223] p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Impressions</p><p className="mt-2 text-2xl font-bold text-white">{totals.impressions.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#081223] p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Clicks</p><p className="mt-2 text-2xl font-bold text-white">{totals.clicks.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#081223] p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Overall CTR</p><p className="mt-2 text-2xl font-bold text-white">{ctr(totals.impressions, totals.clicks)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#081223] p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Top campaign</p><p className="mt-2 truncate text-sm font-bold text-white">{topCampaign?.title ?? "—"}</p><p className="mt-1 text-xs text-gray-500">{topCampaign ? `${topCampaign.clicks.toLocaleString()} clicks · ${ctr(topCampaign.impressions, topCampaign.clicks)}` : "No matching campaign"}</p></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-xs text-gray-500">Active</p><p className="mt-1 text-xl font-bold text-white">{active}</p></div>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="text-xs text-gray-500">Scheduled</p><p className="mt-1 text-xl font-bold text-white">{scheduled}</p></div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="text-xs text-gray-500">Paused</p><p className="mt-1 text-xl font-bold text-white">{paused}</p></div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4"><p className="text-xs text-gray-500">Expired</p><p className="mt-1 text-xl font-bold text-white">{expired}</p></div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#081223] text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Placement</th><th className="px-4 py-3">Campaigns</th><th className="px-4 py-3">Impressions</th><th className="px-4 py-3">Clicks</th><th className="px-4 py-3">CTR</th></tr></thead>
          <tbody>{placementStats.map((row) => <tr key={row.placement} className="border-t border-white/10 text-gray-300"><td className="px-4 py-3 font-medium text-white">{row.placement}</td><td className="px-4 py-3">{row.campaigns}</td><td className="px-4 py-3">{row.impressions.toLocaleString()}</td><td className="px-4 py-3">{row.clicks.toLocaleString()}</td><td className="px-4 py-3">{ctr(row.impressions, row.clicks)}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h3 className="text-base font-semibold text-white">Campaign performance</h3><p className="mt-1 text-xs text-gray-500">Use the filters above to review a focused campaign set.</p></div>
        <label className="space-y-1 text-xs text-gray-500">Sort by<select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="ml-2 rounded-xl border border-white/10 bg-[#081223] px-3 py-2 text-sm text-white outline-none"><option value="performance">Performance</option><option value="impressions">Impressions</option><option value="clicks">Clicks</option><option value="ctr">CTR</option></select></label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#081223] text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Campaign</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Placement</th><th className="px-4 py-3">Period</th><th className="px-4 py-3">Impressions</th><th className="px-4 py-3">Clicks</th><th className="px-4 py-3">CTR</th></tr></thead>
          <tbody>{ranked.length ? ranked.map((ad) => <tr key={ad.id} className="border-t border-white/10 text-gray-300"><td className="px-4 py-3"><div className="font-medium text-white">{ad.title}</div><div className="text-xs text-gray-500">{ad.advertiser_name}</div></td><td className="px-4 py-3">{ad.status}</td><td className="px-4 py-3">{ad.placement}</td><td className="whitespace-nowrap px-4 py-3">{formatDate(ad.start_at)} – {formatDate(ad.end_at)}</td><td className="px-4 py-3">{ad.impressions.toLocaleString()}</td><td className="px-4 py-3">{ad.clicks.toLocaleString()}</td><td className="px-4 py-3 font-semibold text-white">{ctr(ad.impressions, ad.clicks)}</td></tr>) : <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">No campaigns match the selected filters.</td></tr>}</tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600">Reporting currently uses aggregate counters stored on each campaign. Event-level historical analytics and billing attribution can be added in the next reporting stage.</p>
    </section>
  );
}

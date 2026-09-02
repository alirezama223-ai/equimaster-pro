"use client";

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

function ctr(impressions: number, clicks: number) {
  return impressions > 0 ? `${((clicks / impressions) * 100).toFixed(2)}%` : "0.00%";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export default function AdvertisementReporting({ advertisements }: { advertisements: ReportAd[] }) {
  const totals = advertisements.reduce(
    (acc, ad) => ({
      impressions: acc.impressions + (ad.impressions || 0),
      clicks: acc.clicks + (ad.clicks || 0),
    }),
    { impressions: 0, clicks: 0 },
  );

  const active = advertisements.filter((ad) => ad.status === "active").length;
  const scheduled = advertisements.filter((ad) => ad.status === "scheduled").length;
  const paused = advertisements.filter((ad) => ad.status === "paused").length;
  const expired = advertisements.filter((ad) => ad.status === "expired").length;

  const placementStats = ["homepage_top", "homepage_featured", "homepage_bottom"].map((placement) => {
    const ads = advertisements.filter((ad) => ad.placement === placement);
    return {
      placement,
      campaigns: ads.length,
      impressions: ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0),
      clicks: ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0),
    };
  });

  const ranked = [...advertisements].sort((a, b) => {
    const aCtr = a.impressions ? a.clicks / a.impressions : 0;
    const bCtr = b.impressions ? b.clicks / b.impressions : 0;
    return (b.clicks - a.clicks) || (bCtr - aCtr) || (b.impressions - a.impressions);
  });

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-[#111827] p-6">
      <div>
        <h2 className="text-xl font-bold text-white">Campaign reporting</h2>
        <p className="mt-1 text-sm text-gray-400">Live aggregate performance from recorded advertisement impressions and clicks.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#081223] p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Campaigns</p><p className="mt-2 text-2xl font-bold text-white">{advertisements.length}</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#081223] p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Impressions</p><p className="mt-2 text-2xl font-bold text-white">{totals.impressions.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#081223] p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Clicks</p><p className="mt-2 text-2xl font-bold text-white">{totals.clicks.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#081223] p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Overall CTR</p><p className="mt-2 text-2xl font-bold text-white">{ctr(totals.impressions, totals.clicks)}</p></div>
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

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#081223] text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Campaign</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Placement</th><th className="px-4 py-3">Period</th><th className="px-4 py-3">Impressions</th><th className="px-4 py-3">Clicks</th><th className="px-4 py-3">CTR</th></tr></thead>
          <tbody>{ranked.map((ad) => <tr key={ad.id} className="border-t border-white/10 text-gray-300"><td className="px-4 py-3"><div className="font-medium text-white">{ad.title}</div><div className="text-xs text-gray-500">{ad.advertiser_name}</div></td><td className="px-4 py-3">{ad.status}</td><td className="px-4 py-3">{ad.placement}</td><td className="px-4 py-3 whitespace-nowrap">{formatDate(ad.start_at)} – {formatDate(ad.end_at)}</td><td className="px-4 py-3">{ad.impressions.toLocaleString()}</td><td className="px-4 py-3">{ad.clicks.toLocaleString()}</td><td className="px-4 py-3 font-semibold text-white">{ctr(ad.impressions, ad.clicks)}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

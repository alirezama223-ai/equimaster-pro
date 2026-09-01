"use client";

import { useState } from "react";
import { createAdvertisement, updateAdvertisementStatus } from "@/app/actions/advertisements";

type Ad = {
  id: string;
  title: string;
  advertiser_name: string;
  image_url: string;
  target_url: string | null;
  placement: string;
  start_at: string;
  end_at: string;
  status: string;
  priority: number;
  impressions: number;
  clicks: number;
};

const placements = ["homepage_top", "homepage_featured", "homepage_bottom"];

export default function AdvertisementManager({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState(initialAds);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function create(formData: FormData) {
    setBusy(true); setMessage("");
    const result = await createAdvertisement(formData);
    setMessage(result.ok ? "Advertisement created as Draft." : result.error ?? "Unable to create advertisement.");
    setBusy(false);
    if (result.ok) window.location.reload();
  }

  async function status(id: string, next: string) {
    setBusy(true); setMessage("");
    const fd = new FormData(); fd.set("id", id); fd.set("status", next);
    const result = await updateAdvertisementStatus(fd);
    if (!result.ok) setMessage(result.error ?? "Unable to update advertisement.");
    else setAds((current) => current.map((ad) => ad.id === id ? { ...ad, status: next } : ad));
    setBusy(false);
  }

  return <div className="space-y-8">
    <form action={create} className="rounded-3xl border border-white/10 bg-[#111827] p-6">
      <h2 className="text-xl font-bold">Create advertisement</h2>
      <p className="mt-1 text-sm text-gray-400">Create the campaign first. It remains Draft until you activate it.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <input name="title" required placeholder="Advertisement title" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white" />
        <input name="advertiser_name" required placeholder="Advertiser / company" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white" />
        <input name="image_url" required type="url" placeholder="Banner image URL (https://…)" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white md:col-span-2" />
        <input name="target_url" required type="url" placeholder="Destination URL (https://…)" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white md:col-span-2" />
        <select name="placement" defaultValue="homepage_featured" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white">{placements.map((p) => <option key={p}>{p}</option>)}</select>
        <input name="priority" type="number" min="0" max="1000" defaultValue="0" placeholder="Priority" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white" />
        <label className="text-sm text-gray-400">Start<input name="start_at" required type="datetime-local" className="mt-1 block w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white" /></label>
        <label className="text-sm text-gray-400">End<input name="end_at" required type="datetime-local" className="mt-1 block w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white" /></label>
      </div>
      <button disabled={busy} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Create Draft"}</button>
      {message && <p className="mt-3 text-sm text-amber-300">{message}</p>}
    </form>

    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
      <h2 className="text-xl font-bold text-white">Advertisement campaigns</h2>
      {ads.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-10 text-center text-gray-500">No advertisements yet.</p> : <div className="mt-5 space-y-4">{ads.map((ad) => <article key={ad.id} className="rounded-2xl border border-white/10 bg-[#081223] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">{ad.title}</h3><span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-300">{ad.status}</span></div><p className="mt-1 text-sm text-gray-400">{ad.advertiser_name} · {ad.placement} · priority {ad.priority}</p><p className="mt-1 text-xs text-gray-500">{ad.impressions} impressions · {ad.clicks} clicks</p></div><div className="flex flex-wrap gap-2">{ad.status !== "active" && ad.status !== "rejected" && <button type="button" disabled={busy} onClick={() => status(ad.id, "active")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Activate</button>}{ad.status === "active" && <button type="button" disabled={busy} onClick={() => status(ad.id, "paused")} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Pause</button>}{ad.status !== "rejected" && <button type="button" disabled={busy} onClick={() => status(ad.id, "rejected")} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300 disabled:opacity-50">Reject</button>}</div></div></article>)}</div>}
    </section>
  </div>;
}

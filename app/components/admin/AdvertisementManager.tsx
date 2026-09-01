"use client";

import { useState } from "react";
import { createAdvertisement, updateAdvertisementStatus } from "@/app/actions/advertisements";

type Ad = { id: string; title: string; advertiser_name: string; image_url: string; target_url: string | null; placement: string; start_at: string | null; end_at: string | null; status: string; priority: number; impressions: number; clicks: number };

const placements = ["homepage_top", "homepage_featured", "homepage_bottom"];
const statuses = ["draft", "pending", "active", "paused", "rejected"];

export default function AdvertisementManager({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState(initialAds);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function create(formData: FormData) {
    setBusy(true); setMessage("");
    const result = await createAdvertisement(formData);
    if (!result.ok) setMessage(result.error ?? "Unable to create advertisement.");
    else setMessage("Advertisement created as Draft.");
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
        <input name="title" required placeholder="Advertisement title" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3" />
        <input name="advertiser_name" required placeholder="Advertiser / company" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3" />
        <input name="image_url" required type="url" placeholder="Banner image URL (https://…)" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3 md:col-span-2" />
        <input name="target_url" type="url" placeholder="Destination URL (https://…)" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3 md:col-span-2" />
        <select name="placement" defaultValue="homepage_featured" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3">{placements.map((p) => <option key={p}>{p}</option>)}</select>
        <input name="priority" type="number" min="0" max="1000" defaultValue="0" placeholder="Priority" className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3" />
        <label className="text-sm text-gray-400">Start<input name="start_at" type="datetime-local" className="mt-1 block w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white" /></label>
        <label className="text-sm text-gray-400">End<input name="end_at" type="datetime-local" className="mt-1 block w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3 text-white" /></label>
      </div>
      <button disabled={busy} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-semibold disabled:opacity-50">Create Draft</button>
      {message && <p className="mt-3 text-sm text-amber-300">{message}</p>}
    </form>

    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6">
      <h2 className="text-xl font-bold">Advertisement campaigns</h2>
      {ads.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-10 text-center text-gray-500">No advertisements yet.</p> : <div className="mt-5 space-y-4">{ads.map((ad) => <article key={ad.id} className="rounded-2xl border border-white/10 bg-[#081223] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{ad.title}</h3><span className="rounded-full bg-white/5 px-2.5 py-1 text-xs">{ad.status}</span></div><p className="mt-1 text-sm text-gray-400">{ad.advertiser_name} · {ad.placement} · priority {ad.priority}</p><p className="mt-1 text-xs text-gray-500">{ad.impressions} impressions · {ad.clicks} clicks</p></div><div className="flex flex-wrap gap-2">{ad.status !== "active" && <button disabled={busy} onClick={() => status(ad.id, "active")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold">Activate</button>}{ad.status === "active" && <button disabled={busy} onClick={() => status(ad.id, "paused")} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold">Pause</button>}{ad.status !== "rejected" && <button disabled={busy} onClick={() => status(ad.id, "rejected")} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300">Reject</button>}</div></div></article>)}</div>}
    </section>
  </div>;
}
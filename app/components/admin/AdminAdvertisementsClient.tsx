"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createHomepageAdvertisement,
  setHomepageAdvertisementStatus,
  type HomepageAdvertisement,
} from "@/app/actions/advertisements";

type Props = { advertisements: HomepageAdvertisement[] };

export default function AdminAdvertisementsClient({ advertisements }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await createHomepageAdvertisement(data);
      setMessage(result.error ?? "Advertisement submitted for review.");
      if (!result.error) form.reset();
      router.refresh();
    });
  }

  function changeStatus(id: string, status: "active" | "paused" | "pending") {
    startTransition(async () => {
      const result = await setHomepageAdvertisementStatus(id, status);
      setMessage(result.error ?? `Advertisement ${status}.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Add homepage advertisement</h2>
          <p className="mt-2 text-sm text-gray-400">Create a campaign here, then activate it when the advertiser is approved.</p>
        </div>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-gray-300">Title<input name="title" required className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" placeholder="Premium Riding School" /></label>
          <label className="space-y-2 text-sm text-gray-300">Advertiser name<input name="advertiser_name" required className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" placeholder="Example Equestrian" /></label>
          <label className="space-y-2 text-sm text-gray-300">Image URL<input name="image_url" type="url" className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" placeholder="https://..." /></label>
          <label className="space-y-2 text-sm text-gray-300">Target URL<input name="target_url" type="url" className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" placeholder="https://..." /></label>
          <label className="space-y-2 text-sm text-gray-300">Alt text<input name="alt_text" className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" placeholder="Advertisement description" /></label>
          <label className="space-y-2 text-sm text-gray-300">Priority<input name="priority" type="number" defaultValue="0" className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" /></label>
          <label className="space-y-2 text-sm text-gray-300">Starts at<input name="starts_at" type="datetime-local" className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" /></label>
          <label className="space-y-2 text-sm text-gray-300">Ends at<input name="ends_at" type="datetime-local" className="w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-white" /></label>
          <div className="md:col-span-2 flex flex-wrap items-center gap-4 pt-2">
            <button disabled={isPending} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{isPending ? "Saving…" : "Submit advertisement"}</button>
            {message && <span className="text-sm text-gray-400">{message}</span>}
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Advertisement campaigns</h2>
        {advertisements.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-400">No advertisements yet.</div>
        ) : advertisements.map((ad) => (
          <article key={ad.id} className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">{ad.status}</span>
                  <span className="text-xs text-gray-500">Priority {ad.priority}</span>
                </div>
                <h3 className="truncate text-lg font-bold text-white">{ad.title}</h3>
                <p className="mt-1 text-sm text-gray-400">{ad.advertiser_name}</p>
                <p className="mt-2 text-xs text-gray-500">{new Date(ad.starts_at).toLocaleString()} {ad.ends_at ? `→ ${new Date(ad.ends_at).toLocaleString()}` : "→ no end date"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ad.status !== "active" && <button onClick={() => changeStatus(ad.id, "active")} disabled={isPending} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Activate</button>}
                {ad.status === "active" && <button onClick={() => changeStatus(ad.id, "paused")} disabled={isPending} className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 text-sm font-semibold text-yellow-200 disabled:opacity-50">Pause</button>}
                {ad.status !== "pending" && <button onClick={() => changeStatus(ad.id, "pending")} disabled={isPending} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-300 disabled:opacity-50">Set pending</button>}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

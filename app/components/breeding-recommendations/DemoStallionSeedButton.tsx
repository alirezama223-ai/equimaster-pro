"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { seedDemoStallionMatch } from "@/app/actions/demo";

export default function DemoStallionSeedButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSeed() {
    setMessage(null);
    startTransition(async () => {
      const result = await seedDemoStallionMatch();
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage("Demo stallions are ready. Bella is prepared for testing.");
      router.refresh();
    });
  }

  return (
    <aside className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-950/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Test mode</p>
          <p className="mt-1 text-sm text-gray-300">Create isolated SHABDIZ demo stallions so you can test Stallion Match without real breeding data.</p>
        </div>
        <button
          type="button"
          onClick={handleSeed}
          disabled={pending}
          className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Preparing demo…" : "Load demo stallions"}
        </button>
      </div>
      {message ? <p className="mt-3 text-xs text-gray-400">{message}</p> : null}
    </aside>
  );
}

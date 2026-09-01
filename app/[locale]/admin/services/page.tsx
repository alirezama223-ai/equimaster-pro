import { getAdminEquestrianServiceProviders, moderateEquestrianServiceProvider } from "@/app/actions/equestrianServices";

const labels: Record<string, string> = {
  riding_school: "Riding School",
  trainer: "Trainer",
  horse_training: "Horse Training",
  livery: "Livery / Boarding",
  veterinary: "Veterinary",
  farrier: "Farrier",
  physiotherapy: "Equine Physiotherapy",
  transport: "Horse Transport",
  shop: "Equestrian Shop",
  competition_coaching: "Competition Coaching",
  other: "Other",
};

export default async function AdminServicesPage() {
  const { providers, error } = await getAdminEquestrianServiceProviders("pending");

  async function approveService(formData: FormData) {
    "use server";
    await moderateEquestrianServiceProvider(formData);
  }

  async function rejectService(formData: FormData) {
    "use server";
    await moderateEquestrianServiceProvider(formData);
  }

  return (
    <main className="min-h-screen bg-[#081223] px-4 pb-20 pt-28 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[4px] text-blue-400">Admin</p>
          <h1 className="mt-2 text-3xl font-black">Equestrian Service Review</h1>
          <p className="mt-2 text-gray-400">Review provider submissions before they become visible in the local services finder.</p>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</div>}

        {providers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#111827] p-12 text-center text-gray-400">
            No pending service submissions.
          </div>
        ) : (
          <div className="grid gap-5">
            {providers.map((provider) => (
              <article key={provider.id} className="rounded-2xl border border-white/10 bg-[#111827] p-6">
                <div className="flex flex-col justify-between gap-5 lg:flex-row">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">{labels[provider.category] ?? provider.category}</span>
                      <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">Pending</span>
                    </div>
                    <h2 className="mt-3 text-xl font-bold">{provider.name}</h2>
                    <p className="mt-1 text-gray-400">{provider.city}, {provider.country}{provider.postal_code ? ` · ${provider.postal_code}` : ""}</p>
                    {provider.address && <p className="mt-1 text-sm text-gray-500">{provider.address}</p>}
                    {provider.description && <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-gray-300">{provider.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-400">
                      {provider.phone && <span>☎ {provider.phone}</span>}
                      {provider.email && <span>✉ {provider.email}</span>}
                      {provider.website && <a className="text-blue-300 underline" href={provider.website} target="_blank" rel="noreferrer">Website</a>}
                    </div>
                    {provider.disciplines?.length > 0 && <p className="mt-3 text-xs text-gray-500">Disciplines: {provider.disciplines.join(", ")}</p>}
                    {provider.latitude != null && provider.longitude != null && <p className="mt-2 text-xs text-gray-500">Coordinates: {provider.latitude}, {provider.longitude}</p>}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:w-52 lg:flex-col">
                    <form action={approveService}>
                      <input type="hidden" name="id" value={provider.id} />
                      <input type="hidden" name="action" value="approve" />
                      <button className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold">Approve</button>
                    </form>
                    <form action={rejectService}>
                      <input type="hidden" name="id" value={provider.id} />
                      <input type="hidden" name="action" value="reject" />
                      <button className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200">Reject</button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

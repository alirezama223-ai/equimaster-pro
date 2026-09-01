import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/navbar/Navbar";
import { getEquestrianServiceProvider } from "@/app/actions/equestrianServices";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

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

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { provider } = await getEquestrianServiceProvider(id);
  return {
    title: provider ? `${provider.name} | Shabdiz` : "Equestrian Service | Shabdiz",
    description: provider?.description ?? "Equestrian service provider on Shabdiz.",
  };
}

export default async function ServiceProviderPage({ params }: Props) {
  const { locale, id } = await params;
  const { provider } = await getEquestrianServiceProvider(id);
  if (!provider) notFound();

  const mapsQuery = encodeURIComponent([provider.name, provider.address, provider.city, provider.country].filter(Boolean).join(", "));
  const category = labels[provider.category] ?? provider.category;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#081223] px-4 pb-24 pt-28 text-white sm:px-6">
        <div className="mx-auto max-w-[1100px]">
          <Link href={`/${locale}/services`} className="text-sm font-semibold text-blue-400 hover:text-blue-300">← Back to services</Link>

          <section className="mt-6 rounded-3xl border border-blue-500/20 bg-[#111827] p-6 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">{category}</span>
                  {provider.verified && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">✓ Verified Provider</span>}
                </div>
                <h1 className="mt-4 text-3xl font-black sm:text-5xl">{provider.name}</h1>
                <p className="mt-3 text-lg text-gray-400">{provider.city}, {provider.country}{provider.postal_code ? ` · ${provider.postal_code}` : ""}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {provider.phone && <a href={`tel:${provider.phone}`} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold">☎ Call</a>}
                {provider.email && <a href={`mailto:${provider.email}`} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold">✉ Email</a>}
                <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold">📍 Open in Maps</a>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div>
                <h2 className="text-xl font-bold">About this provider</h2>
                <p className="mt-3 whitespace-pre-line leading-7 text-gray-400">{provider.description || "No description has been provided yet."}</p>

                {provider.disciplines.length > 0 && <div className="mt-7"><h2 className="text-xl font-bold">Disciplines</h2><div className="mt-3 flex flex-wrap gap-2">{provider.disciplines.map((item) => <span key={item} className="rounded-full bg-white/5 px-3 py-1.5 text-sm text-gray-300">{item}</span>)}</div></div>}

                {provider.languages.length > 0 && <div className="mt-7"><h2 className="text-xl font-bold">Languages</h2><div className="mt-3 flex flex-wrap gap-2">{provider.languages.map((item) => <span key={item} className="rounded-full bg-white/5 px-3 py-1.5 text-sm text-gray-300">{item}</span>)}</div></div>}
              </div>

              <aside className="rounded-2xl border border-white/10 bg-[#081223] p-5">
                <h2 className="text-lg font-bold">Contact & location</h2>
                <div className="mt-4 space-y-4 text-sm text-gray-400">
                  {provider.address && <p><span className="block text-xs uppercase tracking-wider text-gray-500">Address</span><span className="mt-1 block text-gray-200">{provider.address}</span></p>}
                  <p><span className="block text-xs uppercase tracking-wider text-gray-500">Location</span><span className="mt-1 block text-gray-200">{provider.city}, {provider.country}{provider.postal_code ? ` · ${provider.postal_code}` : ""}</span></p>
                  {provider.phone && <p><span className="block text-xs uppercase tracking-wider text-gray-500">Phone</span><a href={`tel:${provider.phone}`} className="mt-1 block text-blue-400">{provider.phone}</a></p>}
                  {provider.email && <p><span className="block text-xs uppercase tracking-wider text-gray-500">Email</span><a href={`mailto:${provider.email}`} className="mt-1 block break-all text-blue-400">{provider.email}</a></p>}
                  {provider.website && <p><span className="block text-xs uppercase tracking-wider text-gray-500">Website</span><a href={provider.website} target="_blank" rel="noreferrer" className="mt-1 block break-all text-blue-400">{provider.website}</a></p>}
                  {provider.price_from != null && <p><span className="block text-xs uppercase tracking-wider text-gray-500">Starting price</span><span className="mt-1 block text-lg font-bold text-gray-100">{provider.price_from}</span></p>}
                </div>
                <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold">Open location in Maps</a>
              </aside>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
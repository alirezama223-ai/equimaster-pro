import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import { getMarketplaceListingsByIds } from "@/app/actions/marketplace";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatPrice(price: number | null, priceOnRequest: boolean) {
  if (priceOnRequest || price == null) return "On request";
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
}

export default async function HorseComparePage({ searchParams }: Props) {
  const resolved = await searchParams;
  const rawIds = firstParam(resolved.ids) ?? "";
  const ids = rawIds.split(",").filter(Boolean).slice(0, 3);
  const { listings, error } = await getMarketplaceListingsByIds(ids);
  const tCommon = await getTranslations("common");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#081223] px-4 pb-24 pt-28 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[5px] text-blue-400">Marketplace</p>
              <h1 className="mt-3 text-3xl font-black sm:text-5xl">Compare Horses</h1>
              <p className="mt-3 text-gray-400">Compare up to three active listings side by side.</p>
            </div>
            <Link href="/horses" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/5">← Back to marketplace</Link>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">Unable to load the selected horses. Please try again.</div>
          ) : listings.length < 2 ? (
            <div className="rounded-3xl border border-white/10 bg-[#111827] p-10 text-center">
              <div className="text-5xl">🐎</div>
              <h2 className="mt-5 text-2xl font-bold">Select at least two horses</h2>
              <p className="mx-auto mt-3 max-w-xl text-gray-400">Return to the marketplace and use the ↔ button on two or three horses.</p>
              <Link href="/horses" className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500">Browse Marketplace</Link>
            </div>
          ) : (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827] shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="w-44 p-5 text-left text-xs uppercase tracking-wider text-gray-500">Specification</th>
                      {listings.map((horse) => {
                        const image = horse.cover_image_url ?? horse.image_urls?.[0];
                        return (
                          <th key={horse.id} className="min-w-[250px] p-5 text-left align-top">
                            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081223]">
                              {image ? <img src={image} alt={horse.name} className="h-40 w-full object-cover" /> : <div className="flex h-40 items-center justify-center text-5xl">🐎</div>}
                            </div>
                            <h2 className="mt-4 text-xl font-bold">{horse.name}</h2>
                            <p className="mt-1 text-sm text-gray-400">{horse.breed}</p>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Price", ...listings.map((h) => formatPrice(h.price, h.price_on_request))],
                      ["Gender", ...listings.map((h) => h.gender)],
                      ["Age", ...listings.map((h) => `${h.age} yrs`)],
                      ["Height", ...listings.map((h) => `${h.height} cm`)],
                      ["Color", ...listings.map((h) => h.color)],
                      ["Country", ...listings.map((h) => h.country)],
                      ["Discipline", ...listings.map((h) => h.discipline)],
                      ["Level", ...listings.map((h) => h.level)],
                      ["Sire", ...listings.map((h) => h.sire)],
                      ["Dam", ...listings.map((h) => h.dam)],
                      ["Dam sire", ...listings.map((h) => h.dam_sire)],
                      ["Seller", ...listings.map((h) => h.seller_name)],
                      ["Verified", ...listings.map((h) => h.verified || h.owner_seller_verified ? "Verified" : "Unverified")],
                    ].map(([label, ...values]) => (
                      <tr key={label} className="border-b border-white/5 last:border-b-0">
                        <th className="bg-[#0c1527] p-5 text-left text-sm font-semibold text-gray-400">{label}</th>
                        {values.map((value, index) => <td key={`${label}-${index}`} className="p-5 text-sm font-medium text-white">{value}</td>)}
                      </tr>
                    ))}
                    <tr>
                      <th className="bg-[#0c1527] p-5 text-left text-sm font-semibold text-gray-400">Description</th>
                      {listings.map((horse) => <td key={horse.id} className="max-w-sm p-5 text-sm leading-6 text-gray-300">{horse.description || tCommon("notAvailable")}</td>)}
                    </tr>
                    <tr>
                      <th className="bg-[#0c1527] p-5 text-left text-sm font-semibold text-gray-400">Listing</th>
                      {listings.map((horse) => <td key={horse.id} className="p-5"><Link href={`/horses/${horse.slug}`} className="inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500">View {horse.name} →</Link></td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

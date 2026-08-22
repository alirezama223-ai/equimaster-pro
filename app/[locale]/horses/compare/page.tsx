import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import { getMarketplaceListingsByIds } from "@/app/actions/marketplace";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Horse = Awaited<ReturnType<typeof getMarketplaceListingsByIds>>["listings"][number];

type Insight = {
  label: string;
  horseId: string;
  horseName: string;
  detail: string;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatPrice(price: number | null, priceOnRequest: boolean) {
  if (priceOnRequest || price == null) return "On request";
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
}

function getFallbackHorseImage(index: number) {
  return `https://loremflickr.com/900/520/horse?lock=${700 + index}`;
}

function getInsights(listings: Horse[]): Insight[] {
  const insights: Insight[] = [];
  const priced = listings.filter((h) => !h.price_on_request && h.price != null);
  if (priced.length >= 2) {
    const bestPrice = priced.reduce((best, horse) => (horse.price! < best.price! ? horse : best));
    insights.push({ label: "Best Price", horseId: bestPrice.id, horseName: bestPrice.name, detail: formatPrice(bestPrice.price, false) });
  }

  if (listings.length >= 2) {
    const youngest = listings.reduce((best, horse) => (horse.age < best.age ? horse : best));
    insights.push({ label: "Youngest", horseId: youngest.id, horseName: youngest.name, detail: `${youngest.age} years` });

    const tallest = listings.reduce((best, horse) => (horse.height > best.height ? horse : best));
    insights.push({ label: "Tallest", horseId: tallest.id, horseName: tallest.name, detail: `${tallest.height} cm` });
  }

  const ranked = listings.filter((h) => typeof h.level === "string" && h.level.trim());
  if (ranked.length >= 2) {
    const scoreLevel = (level: string) => {
      const gp = /grand prix/i.test(level) ? 10 : 0;
      const star = level.match(/(\d+)\s*\*/i)?.[1];
      const meter = level.match(/(\d+(?:\.\d+)?)\s*m/i)?.[1];
      return gp + (star ? Number(star) * 2 : 0) + (meter ? Number(meter) * 2 : 0);
    };
    const highest = ranked.reduce((best, horse) => scoreLevel(horse.level) > scoreLevel(best.level) ? horse : best);
    insights.push({ label: "Highest Level", horseId: highest.id, horseName: highest.name, detail: highest.level });
  }

  return insights;
}

function getOverallMatch(listings: Horse[]): { horse: Horse; score: number } | null {
  if (listings.length < 2) return null;
  const priced = listings.filter((h) => !h.price_on_request && h.price != null);
  const minPrice = priced.length ? Math.min(...priced.map((h) => h.price!)) : null;
  const maxPrice = priced.length ? Math.max(...priced.map((h) => h.price!)) : null;
  const minAge = Math.min(...listings.map((h) => h.age));
  const maxAge = Math.max(...listings.map((h) => h.age));
  const minHeight = Math.min(...listings.map((h) => h.height));
  const maxHeight = Math.max(...listings.map((h) => h.height));

  const scored = listings.map((horse) => {
    let score = 50;
    if (minPrice !== null && maxPrice !== null && maxPrice !== minPrice && horse.price != null) score += ((maxPrice - horse.price) / (maxPrice - minPrice)) * 20;
    if (maxAge !== minAge) score += ((maxAge - horse.age) / (maxAge - minAge)) * 10;
    if (maxHeight !== minHeight) score += ((horse.height - minHeight) / (maxHeight - minHeight)) * 5;
    if (horse.verified || horse.owner_seller_verified) score += 5;
    if (horse.description) score += 5;
    if (horse.image_urls?.length) score += 5;
    return { horse, score: Math.round(score) };
  });

  return scored.reduce((best, current) => current.score > best.score ? current : best);
}

export default async function HorseComparePage({ searchParams }: Props) {
  const resolved = await searchParams;
  const rawIds = firstParam(resolved.ids) ?? "";
  const ids = rawIds.split(",").filter(Boolean).slice(0, 3);
  const { listings, error } = await getMarketplaceListingsByIds(ids);
  const tCommon = await getTranslations("common");
  const insights = getInsights(listings);
  const overall = getOverallMatch(listings);

  const comparisonRows = [
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
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#081223] px-3 pb-24 pt-24 text-white sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[4px] text-blue-400 sm:text-xs sm:tracking-[5px]">Marketplace</p>
              <h1 className="mt-2 text-3xl font-black sm:mt-3 sm:text-5xl">Compare Horses</h1>
              <p className="mt-2 text-sm text-gray-400 sm:mt-3 sm:text-base">Compare up to three active listings side by side.</p>
            </div>
            <Link href="/horses" className="self-start rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:bg-white/5 sm:self-auto sm:px-5 sm:py-3">← Back to marketplace</Link>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200 sm:p-6 sm:text-base">Unable to load the selected horses. Please try again.</div>
          ) : listings.length < 2 ? (
            <div className="rounded-3xl border border-white/10 bg-[#111827] p-8 text-center sm:p-10">
              <div className="text-5xl">🐎</div>
              <h2 className="mt-5 text-2xl font-bold">Select at least two horses</h2>
              <p className="mx-auto mt-3 max-w-xl text-gray-400">Return to the marketplace and use the ↔ button on two or three horses.</p>
              <Link href="/horses" className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500">Browse Marketplace</Link>
            </div>
          ) : (
            <>
              {overall && (
                <section className="mb-5 rounded-3xl border border-blue-400/20 bg-gradient-to-r from-blue-500/10 via-[#111827] to-[#111827] p-5 shadow-xl sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[3px] text-blue-300"><span>🏆</span> Best Overall Match</div>
                      <h2 className="mt-2 text-2xl font-black sm:text-3xl">{overall.horse.name}</h2>
                      <p className="mt-1 text-sm text-gray-400">Based on price, age, height, verification, listing completeness and available photos.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl border border-white/10 bg-black/10 px-5 py-3 text-center"><div className="text-2xl font-black text-white">{overall.score}</div><div className="text-[9px] uppercase tracking-[2px] text-gray-500">Match score</div></div>
                      <Link href={`/horses/${overall.horse.slug}`} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">View {overall.horse.name} →</Link>
                    </div>
                  </div>
                </section>
              )}

              {insights.length > 0 && (
                <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {insights.map((insight) => (
                    <div key={insight.label} className="rounded-2xl border border-white/10 bg-[#111827] p-4">
                      <div className="text-[9px] font-bold uppercase tracking-[2px] text-gray-500">{insight.label}</div>
                      <div className="mt-2 truncate text-base font-bold text-white">{insight.horseName}</div>
                      <div className="mt-1 text-xs text-blue-300">{insight.detail}</div>
                    </div>
                  ))}
                </section>
              )}

              <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827] shadow-2xl">
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] border-collapse">
                    <thead><tr className="border-b border-white/10"><th className="w-44 p-5 text-left text-xs uppercase tracking-wider text-gray-500">Specification</th>{listings.map((horse, index) => { const storedImage = horse.cover_image_url ?? horse.image_urls?.[0]; const fallbackImage = getFallbackHorseImage(index); return <th key={horse.id} className="min-w-[250px] p-5 text-left align-top"><div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#081223]"><img src={storedImage || fallbackImage} alt={`${horse.name} - ${horse.breed}`} className="h-40 w-full object-cover" loading="eager" referrerPolicy="no-referrer" />{!storedImage && <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">Demo image</span>}</div><h2 className="mt-4 text-xl font-bold">{horse.name}</h2><p className="mt-1 text-sm text-gray-400">{horse.breed}</p></th>; })}</tr></thead>
                    <tbody>{comparisonRows.map(([label, ...values]) => <tr key={label} className="border-b border-white/5 last:border-b-0"><th className="bg-[#0c1527] p-5 text-left text-sm font-semibold text-gray-400">{label}</th>{values.map((value, index) => <td key={`${label}-${index}`} className="p-5 text-sm font-medium text-white">{value}</td>)}</tr>)}<tr><th className="bg-[#0c1527] p-5 text-left text-sm font-semibold text-gray-400">Description</th>{listings.map((horse) => <td key={horse.id} className="max-w-sm p-5 text-sm leading-6 text-gray-300">{horse.description || tCommon("notAvailable")}</td>)}</tr><tr><th className="bg-[#0c1527] p-5 text-left text-sm font-semibold text-gray-400">Listing</th>{listings.map((horse) => <td key={horse.id} className="p-5"><Link href={`/horses/${horse.slug}`} className="inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500">View {horse.name} →</Link></td>)}</tr></tbody>
                  </table>
                </div>

                <div className="block md:hidden">
                  <div className="border-b border-white/10 p-3"><p className="mb-3 text-[10px] font-semibold uppercase tracking-[3px] text-gray-500">Compare side by side</p><div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${listings.length}, minmax(0, 1fr))` }}>{listings.map((horse, index) => { const storedImage = horse.cover_image_url ?? horse.image_urls?.[0]; const fallbackImage = getFallbackHorseImage(index); return <div key={horse.id} className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#081223] p-2"><div className="relative overflow-hidden rounded-xl"><img src={storedImage || fallbackImage} alt={`${horse.name} - ${horse.breed}`} className="h-24 w-full object-cover min-[420px]:h-28" loading="eager" referrerPolicy="no-referrer" />{!storedImage && <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-wide text-white">Demo</span>}</div><h2 className="mt-2 truncate text-sm font-bold min-[420px]:text-base">{horse.name}</h2><p className="truncate text-[10px] text-gray-400 min-[420px]:text-xs">{horse.breed}</p></div>; })}</div></div>
                  <div>{comparisonRows.map(([label, ...values]) => <div key={label} className="border-b border-white/5 px-3 py-2.5"><div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[2px] text-gray-500">{label}</div><div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${listings.length}, minmax(0, 1fr))` }}>{values.map((value, index) => <div key={`${label}-${index}`} className="min-w-0 break-words text-[11px] font-medium leading-4 text-white min-[420px]:text-xs">{value}</div>)}</div></div>)}<div className="border-b border-white/5 px-3 py-2.5"><div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[2px] text-gray-500">Description</div><div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${listings.length}, minmax(0, 1fr))` }}>{listings.map((horse) => <p key={horse.id} className="min-w-0 break-words text-[10px] leading-4 text-gray-300 min-[420px]:text-xs min-[420px]:leading-5">{horse.description || tCommon("notAvailable")}</p>)}</div></div><div className="px-3 py-3"><div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[2px] text-gray-500">Listing</div><div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${listings.length}, minmax(0, 1fr))` }}>{listings.map((horse) => <Link key={horse.id} href={`/horses/${horse.slug}`} className="inline-flex min-w-0 items-center justify-center rounded-lg bg-blue-600 px-2 py-2 text-[10px] font-semibold text-white transition hover:bg-blue-500 min-[420px]:text-xs">View {horse.name} →</Link>)}</div></div></div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}

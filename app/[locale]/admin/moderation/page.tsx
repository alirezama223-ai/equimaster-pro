import { redirect } from "next/navigation";
import { getPendingEquiMarketListings, moderateEquiMarketListing } from "@/app/actions/moderation";

export const dynamic = "force-dynamic";

function typeLabel(type: string) {
  return type === "horse_rental" ? "Horse for Rent" : "Wanted Horse";
}

export default async function ModerationPage() {
  const result = await getPendingEquiMarketListings();
  if (result.error === "Authentication required." || result.error === "You are not authorized to moderate listings.") {
    redirect("/");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">EquiMaster Pro</p>
          <h1 className="text-3xl font-bold tracking-tight">Moderation Center</h1>
          <p className="mt-2 text-sm text-gray-600">Review marketplace listings before they become public.</p>
        </div>
        <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">{result.listings.length} pending</div>
      </div>

      {result.error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{result.error}</div>}

      {result.listings.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="text-4xl">✓</div>
          <h2 className="mt-3 text-lg font-semibold">No pending listings</h2>
          <p className="mt-1 text-sm text-gray-500">Everything is up to date.</p>
        </section>
      ) : (
        <div className="space-y-5">
          {result.listings.map((listing) => (
            <article key={listing.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">{typeLabel(listing.listing_type)}</span>
                    {listing.discipline && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{listing.discipline}</span>}
                    {listing.level && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{listing.level}</span>}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">{listing.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{listing.description}</p>
                  <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
                    {listing.horse_name && <div><strong>Horse:</strong> {listing.horse_name}</div>}
                    {(listing.city || listing.country) && <div><strong>Location:</strong> {[listing.city, listing.country].filter(Boolean).join(", ")}</div>}
                    {listing.price != null && <div><strong>Price:</strong> {listing.price} {listing.price_period ? `/ ${listing.price_period}` : ""}</div>}
                    {listing.available_from && <div><strong>From:</strong> {listing.available_from}</div>}
                  </div>
                </div>

                <div className="flex w-full shrink-0 flex-col gap-2 lg:w-44">
                  <form action={moderateEquiMarketListing.bind(null, listing.id, "active", "Approved during moderation review.")}>
                    <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700" type="submit">Approve</button>
                  </form>
                  <form action={moderateEquiMarketListing.bind(null, listing.id, "rejected", "Rejected during moderation review.")}>
                    <button className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50" type="submit">Reject</button>
                  </form>
                  <form action={moderateEquiMarketListing.bind(null, listing.id, "paused", "Paused during moderation review.")}>
                    <button className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50" type="submit">Pause</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

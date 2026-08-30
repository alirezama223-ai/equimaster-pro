import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getModerationListingDetails, moderateListing } from "@/app/actions/moderation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; kind: string; id: string }>;
};

type ModerationKind = "equimarket" | "horse_sale";

function isKind(value: string): value is ModerationKind {
  return value === "horse_sale" || value === "equimarket";
}

function text(value: unknown, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function money(value: unknown, onRequest: unknown) {
  if (Boolean(onRequest)) return "Price on request";
  if (value === null || value === undefined || value === "") return "Not provided";
  return String(value);
}

function Detail({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-gray-900">{text(value)}</div>
    </div>
  );
}

export default async function ModerationListingReviewPage({ params }: Props) {
  const { locale, kind, id } = await params;
  if (!isKind(kind)) notFound();

  const result = await getModerationListingDetails(kind, id);
  if (result.error === "Authentication required." || result.error === "You are not authorized to moderate listings.") {
    redirect("/");
  }
  if (!result.listing) notFound();

  const listing = result.listing;
  const images = Array.isArray(listing.image_urls)
    ? listing.image_urls.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];
  const cover = typeof listing.cover_image_url === "string" ? listing.cover_image_url : null;
  const allImages = Array.from(new Set([...(cover ? [cover] : []), ...images]));
  const status = text(listing.status);
  const title = text(listing.title ?? listing.name, "Untitled listing");
  const description = text(listing.description);
  const price = money(listing.price, listing.price_on_request);
  const moderationPath = `/${locale}/admin/moderation`;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={moderationPath} className="text-sm font-semibold text-blue-600 hover:underline">
            ← Back to Moderation Center
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-emerald-600">EquiMaster Pro · Review</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-2 text-sm text-gray-500">Check the complete listing before publishing it.</p>
        </div>
        <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold capitalize text-amber-800">Status: {status}</span>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-gray-900">Photos</h2>
          {allImages.length ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {allImages.map((src, index) => (
                <a key={`${src}-${index}`} href={src} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                  <img src={src} alt={`${title} photo ${index + 1}`} className="aspect-[4/3] h-full w-full object-cover transition group-hover:scale-105" />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-red-600">No photos uploaded.</p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-gray-900">Horse & listing details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Listing type" value={kind === "horse_sale" ? "Horse for Sale" : "Service Listing"} />
            <Detail label="Horse / service name" value={listing.horse_name ?? listing.name ?? listing.title} />
            <Detail label="Breed" value={listing.breed} />
            <Detail label="Gender" value={listing.gender} />
            <Detail label="Age" value={listing.age} />
            <Detail label="Height" value={listing.height} />
            <Detail label="Color" value={listing.color} />
            <Detail label="Discipline" value={listing.discipline} />
            <Detail label="Level" value={listing.level} />
            <Detail label="Country" value={listing.country} />
            <Detail label="City" value={listing.city} />
            <Detail label="Postal code" value={listing.postal_code} />
            <Detail label="Price" value={price} />
            <Detail label="Price period" value={listing.price_period} />
            <Detail label="Sire" value={listing.sire} />
            <Detail label="Dam" value={listing.dam} />
            <Detail label="Dam sire" value={listing.dam_sire} />
            <Detail label="Verification status" value={listing.horse_verification_status ?? listing.verified} />
            <Detail label="Pedigree horse ID" value={listing.pedigree_horse_id} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-gray-900">Full description</h2>
          <div className="mt-4 whitespace-pre-wrap rounded-xl bg-gray-50 p-5 text-sm leading-7 text-gray-800">{description}</div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-gray-900">Seller information</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Seller name" value={listing.seller_name} />
            <Detail label="Seller email" value={listing.seller_email} />
            <Detail label="Seller phone" value={listing.seller_phone} />
            <Detail label="Stable / business" value={listing.stable_name} />
            <Detail label="Seller verified" value={listing.owner_seller_verified} />
            <Detail label="Horse verified" value={listing.verified} />
            <Detail label="Created" value={listing.created_at} />
            <Detail label="Updated" value={listing.updated_at} />
          </div>
        </section>

        {typeof listing.video_url === "string" && listing.video_url ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-gray-900">Video</h2>
            <a href={listing.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
              Open listing video ↗
            </a>
          </section>
        ) : null}

        <section className="sticky bottom-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-bold text-gray-900">Ready to decide?</div>
              <div className="text-sm text-gray-500">Approve only after checking photos, horse data, seller details and description.</div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:min-w-[480px]">
              <form action={moderateListing.bind(null, kind, id, "active", "Approved after full moderation review.")}>
                <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">Approve & Publish</button>
              </form>
              <form action={moderateListing.bind(null, kind, id, "rejected", "Rejected after moderation review.")}>
                <button type="submit" className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50">Reject</button>
              </form>
              <form action={moderateListing.bind(null, kind, id, "paused", "Paused for additional information.")}>
                <button type="submit" className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">Pause</button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

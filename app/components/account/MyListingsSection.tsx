"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteHorseListing } from "@/app/actions/horse-listings";
import {
  formatListingRowPrice,
  getListingCoverImageUrl,
} from "@/app/lib/horse-listings";
import { HorseListingRow } from "@/app/types/horse-listing";

type Props = {
  listings: HorseListingRow[];
};

export default function MyListingsSection({ listings: initialListings }: Props) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this listing permanently? This action cannot be undone."
    );

    if (!confirmed) return;

    setPendingDeleteId(id);
    setError(null);

    const result = await deleteHorseListing(id);

    if (result.error) {
      setError(result.error);
      setPendingDeleteId(null);
      return;
    }

    setListings((current) => current.filter((listing) => listing.id !== id));
    setPendingDeleteId(null);
    router.refresh();
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-3xl bg-[#111827] border border-white/10 p-6 md:col-span-2">
        <h2 className="text-xl font-bold text-white">My Listings</h2>
        <p className="mt-3 text-gray-400 leading-7">
          You have not submitted any horse listings yet.
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-gray-500">
          No saved listings yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-[#111827] border border-white/10 p-6 md:col-span-2">
      <h2 className="text-xl font-bold text-white">My Listings</h2>
      <p className="mt-3 text-gray-400">
        Manage the horse listings you have submitted to EquiMaster Pro.
      </p>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="rounded-2xl bg-[#08111F] border border-white/10 p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex gap-4 min-w-0">
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10">
                <Image
                  src={getListingCoverImageUrl(listing)}
                  alt={listing.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>

              <div className="min-w-0">
                <p className="text-white font-semibold text-lg">{listing.name}</p>
                <p className="text-gray-400 mt-1">
                  {listing.breed} · {listing.discipline} · {listing.level}
                </p>
                <p className="text-blue-400 mt-2 font-semibold">
                  {formatListingRowPrice(listing)}
                </p>
                <p className="text-xs uppercase tracking-wide text-gray-500 mt-2">
                  Status: {listing.status}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/horse/${listing.id}`}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
              >
                View Listing
              </Link>
              <Link
                href={`/horse/${listing.id}/edit`}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(listing.id)}
                disabled={pendingDeleteId === listing.id}
                className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 transition disabled:opacity-60"
              >
                {pendingDeleteId === listing.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

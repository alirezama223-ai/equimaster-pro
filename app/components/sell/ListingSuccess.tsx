import Link from "next/link";
import { formatListingPrice } from "@/app/lib/listing-validation";
import { ListingFormData } from "@/app/types/listing";

type Props = {
  data: ListingFormData;
  listingId?: string;
};

export default function ListingSuccess({ data, listingId }: Props) {
  return (
    <div className="rounded-3xl border border-blue-500/30 bg-[#111C2E] p-8 sm:p-12 text-center">
      <div className="text-6xl mb-6">✅</div>
      <p className="uppercase tracking-[6px] text-blue-400 text-sm font-semibold">
        Submission Received
      </p>
      <h2 className="text-4xl sm:text-5xl font-black text-white mt-4">
        Your listing has been saved
      </h2>
      <p className="mt-6 max-w-2xl mx-auto text-gray-400 text-lg leading-8">
        <strong className="text-white">{data.name}</strong> is now stored in
        EquiMaster Pro at{" "}
        <strong className="text-white">{formatListingPrice(data)}</strong>.
        Your photos have been uploaded and your listing is now live in the
        marketplace.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
        >
          Back to Marketplace
        </Link>
        {listingId ? (
          <Link
            href={`/horse/${listingId}`}
            className="px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold transition"
          >
            View Listing
          </Link>
        ) : null}
        <Link
          href="/account"
          className="px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold transition"
        >
          My Account
        </Link>
      </div>
    </div>
  );
}

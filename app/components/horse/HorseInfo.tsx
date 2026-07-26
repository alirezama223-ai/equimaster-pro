import { Horse } from "@/app/data/horses";
import FavoriteButton from "@/app/components/favorites/FavoriteButton";
import ContactInquiryModal from "@/app/components/horse/ContactInquiryModal";

type BuyerPrefill = {
  buyerName: string;
  buyerEmail: string;
};

type Props = {
  horse: Horse;
  isFavorited?: boolean;
  returnPath: string;
  buyerPrefill?: BuyerPrefill;
  isAuthenticated: boolean;
};

export default function HorseInfo({
  horse,
  isFavorited = false,
  returnPath,
  buyerPrefill,
  isAuthenticated,
}: Props) {
  const detailPath = horse.listingUuid ? `/horse/${horse.listingUuid}` : returnPath;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-bold">{horse.name}</h1>

        <p className="text-blue-400 mt-2">Premium Sport Horse</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InfoCard title="Breed" value={horse.breed} />
        <InfoCard title="Age" value={`${horse.age} years`} />
        <InfoCard title="Height" value={`${horse.height} cm`} />
        <InfoCard title="Country" value={horse.country} />
        <InfoCard title="Gender" value={horse.gender} />
        <InfoCard title="Training" value={horse.level} />
        <InfoCard title="Color" value={horse.color} />
        <InfoCard title="Discipline" value={horse.discipline} />
      </div>

      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-3xl p-8">
        <p className="text-gray-200 text-sm">Price</p>

        <h2 className="text-5xl font-bold mt-2">{horse.price}</h2>

        <div className="mt-8 space-y-4">
          {horse.listingUuid ? (
            <ContactInquiryModal
              horseName={horse.name}
              listingId={horse.listingUuid}
              returnPath={returnPath}
              buyerPrefill={buyerPrefill}
              isAuthenticated={isAuthenticated}
              fullWidth
            />
          ) : (
            <button className="w-full py-4 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition">
              Contact Seller
            </button>
          )}

          {horse.listingUuid ? (
            <FavoriteButton
              listingId={horse.listingUuid}
              initialFavorited={isFavorited}
              returnPath={detailPath}
              variant="button"
            />
          ) : null}

          <button className="w-full py-4 rounded-xl border border-white/30 hover:bg-white/10 transition">
            Share Listing
          </button>
        </div>
      </div>
    </div>
  );
}

type CardProps = {
  title: string;
  value: string;
};

function InfoCard({ title, value }: CardProps) {
  return (
    <div className="bg-[#111827] rounded-2xl p-5 border border-white/5">
      <p className="text-gray-400 text-sm">{title}</p>

      <h3 className="font-semibold text-lg mt-2">{value}</h3>
    </div>
  );
}

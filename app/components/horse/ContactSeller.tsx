import { Horse } from "@/app/data/horses";
import ContactInquiryModal from "@/app/components/horse/ContactInquiryModal";

type BuyerPrefill = {
  buyerName: string;
  buyerEmail: string;
};

type Props = {
  horse: Horse;
  returnPath: string;
  buyerPrefill?: BuyerPrefill;
  isAuthenticated: boolean;
};

export default function ContactSeller({
  horse,
  returnPath,
  buyerPrefill,
  isAuthenticated,
}: Props) {
  const canInquire = Boolean(horse.listingUuid);

  return (
    <section className="bg-[#111827] rounded-3xl p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
      <div>
        <h2 className="text-3xl font-bold">Interested in {horse.name}?</h2>

        <p className="text-gray-400 mt-2">
          {horse.sellerName
            ? `Contact ${horse.sellerName}${horse.stableName ? ` at ${horse.stableName}` : ""} for more information.`
            : "Contact the seller for more information."}
        </p>

        {canInquire ? (
          <p className="text-sm text-gray-500 mt-3">
            Send a private inquiry through EquiMaster Pro. Your message is shared
            only with the seller.
          </p>
        ) : null}

        {horse.sellerEmail || horse.sellerPhone ? (
          <p className="text-sm text-gray-500 mt-3">
            {horse.sellerEmail ? horse.sellerEmail : null}
            {horse.sellerEmail && horse.sellerPhone ? " · " : null}
            {horse.sellerPhone ? horse.sellerPhone : null}
          </p>
        ) : null}
      </div>

      {canInquire && horse.listingUuid ? (
        <ContactInquiryModal
          horseName={horse.name}
          listingId={horse.listingUuid}
          returnPath={returnPath}
          buyerPrefill={buyerPrefill}
          isAuthenticated={isAuthenticated}
        />
      ) : (
        <a
          href={
            horse.sellerEmail
              ? `mailto:${horse.sellerEmail}?subject=${encodeURIComponent(`Inquiry about ${horse.name}`)}`
              : undefined
          }
          className={`bg-blue-600 px-8 py-4 rounded-xl whitespace-nowrap ${horse.sellerEmail ? "hover:bg-blue-500 transition" : "opacity-60 pointer-events-none"}`}
        >
          Contact Seller
        </a>
      )}
    </section>
  );
}

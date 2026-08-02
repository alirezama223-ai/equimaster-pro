import { getTranslations } from "next-intl/server";
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

export default async function ContactSeller({
  horse,
  returnPath,
  buyerPrefill,
  isAuthenticated,
}: Props) {
  const t = await getTranslations("horse");
  const canInquire = Boolean(horse.listingUuid);

  const contactLine = horse.sellerName
    ? t("contact.withSeller", {
        seller: horse.sellerName,
        stable: horse.stableName
          ? t("contact.atStable", { stable: horse.stableName })
          : "",
      })
    : t("contact.generic");

  return (
    <section className="bg-[#111827] rounded-3xl p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
      <div>
        <h2 className="text-3xl font-bold">{t("contact.title", { name: horse.name })}</h2>

        <p className="text-gray-400 mt-2">{contactLine}</p>

        {canInquire ? (
          <p className="text-sm text-gray-500 mt-3">{t("contact.privateInquiry")}</p>
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
              ? `mailto:${horse.sellerEmail}?subject=${encodeURIComponent(t("contact.mailSubject", { name: horse.name }))}`
              : undefined
          }
          className={`bg-blue-600 px-8 py-4 rounded-xl whitespace-nowrap ${horse.sellerEmail ? "hover:bg-blue-500 transition" : "opacity-60 pointer-events-none"}`}
        >
          {t("contact.contactSeller")}
        </a>
      )}
    </section>
  );
}

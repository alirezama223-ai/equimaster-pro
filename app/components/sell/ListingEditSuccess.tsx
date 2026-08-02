import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { formatListingPrice } from "@/app/lib/listing-validation";
import { ListingFormData } from "@/app/types/listing";

type Props = {
  data: ListingFormData;
  listingId: string;
};

export default function ListingEditSuccess({ data, listingId }: Props) {
  const t = useTranslations("sell");

  return (
    <div className="rounded-3xl border border-blue-500/30 bg-[#111C2E] p-8 sm:p-12 text-center">
      <div className="text-6xl mb-6">✅</div>
      <p className="uppercase tracking-[6px] text-blue-400 text-sm font-semibold">
        {t("editSuccess.eyebrow")}
      </p>
      <h2 className="text-4xl sm:text-5xl font-black text-white mt-4">{t("editSuccess.title")}</h2>
      <p className="mt-6 max-w-2xl mx-auto text-gray-400 text-lg leading-8">
        {t("editSuccess.body", {
          name: data.name,
          price: formatListingPrice(data),
        })}
      </p>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href={`/horse/${listingId}`}
          className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
        >
          {t("editSuccess.viewListing")}
        </Link>
        <Link
          href="/account"
          className="px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold transition"
        >
          {t("editSuccess.myListings")}
        </Link>
      </div>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Horse } from "@/app/data/horses";
import FavoriteButton from "@/app/components/favorites/FavoriteButton";
import StartConversationButton from "@/app/components/messaging/StartConversationButton";

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
  listingStatus?: string;
  pedigreeHorseId?: string | null;
};

export default async function HorseInfo({
  horse,
  isFavorited = false,
  returnPath,
  buyerPrefill,
  isAuthenticated,
  listingStatus,
  pedigreeHorseId,
}: Props) {
  const t = await getTranslations("horse");
  const detailPath = horse.listingUuid ? `/horse/${horse.listingUuid}` : returnPath;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-4xl sm:text-5xl font-black">{horse.name}</h2>
          {horse.verified ? (
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              {t("info.verified")}
            </span>
          ) : null}
        </div>

        <p className="text-blue-400 mt-3 text-lg">
          {horse.discipline} · {horse.level}
        </p>
        {horse.stableName ? (
          <p className="text-gray-400 mt-2">{horse.stableName}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InfoCard title={t("info.breed")} value={horse.breed} />
        <InfoCard title={t("info.age")} value={t("info.ageValue", { age: horse.age })} />
        <InfoCard title={t("info.height")} value={t("info.heightValue", { height: horse.height })} />
        <InfoCard title={t("info.country")} value={horse.country} />
        <InfoCard title={t("info.gender")} value={horse.gender} />
        <InfoCard title={t("info.training")} value={horse.level} />
        <InfoCard title={t("info.color")} value={horse.color} />
        <InfoCard title={t("info.discipline")} value={horse.discipline} />
      </div>

      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/30">
        <p className="text-blue-100 text-sm uppercase tracking-wide">{t("info.askingPrice")}</p>

        <h2 className="text-4xl sm:text-5xl font-black mt-2">{horse.price}</h2>

        <div className="mt-8 space-y-4">
          {horse.listingUuid && listingStatus === "active" ? (
            <StartConversationButton
              horseListingId={horse.listingUuid}
              returnPath={returnPath}
              isAuthenticated={isAuthenticated}
              fullWidth
            />
          ) : (
            <div className="rounded-xl border border-white/20 px-4 py-4 text-sm text-blue-100">
              {listingStatus === "draft"
                ? t("info.draftContact")
                : t("info.contactUnavailable")}
            </div>
          )}

          {pedigreeHorseId ? (
            <Link
              href={`/pedigree/${pedigreeHorseId}`}
              className="block w-full py-4 rounded-xl border border-white/30 text-center font-semibold hover:bg-white/10 transition"
            >
              {t("info.viewPedigree")}
            </Link>
          ) : null}

          {horse.listingUuid ? (
            <FavoriteButton
              listingId={horse.listingUuid}
              initialFavorited={isFavorited}
              returnPath={detailPath}
              variant="button"
            />
          ) : null}
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

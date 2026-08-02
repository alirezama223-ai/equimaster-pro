import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { StallionDetail } from "@/app/types/stallion";

type Props = {
  stallion: StallionDetail;
};

export default async function StallionContact({ stallion }: Props) {
  const t = await getTranslations("stallions");
  const { breeder } = stallion;
  const hasEmail = Boolean(breeder.email?.trim());
  const hasPhone = Boolean(breeder.phone?.trim());
  const hasWebsite = Boolean(breeder.website?.trim());

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-white">{t("contact.title")}</h2>
      <p className="mt-3 text-gray-400">
        {t("contact.descriptionPrefix")}{" "}
        <Link href={`/breeders/${breeder.id}`} className="text-blue-400 hover:text-blue-300">
          {breeder.name}
        </Link>{" "}
        {t("contact.descriptionSuffix", { stallionName: stallion.name })}
      </p>

      <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-4">
        {hasEmail ? (
          <a
            href={`mailto:${breeder.email}?subject=${encodeURIComponent(t("contact.emailSubject", { stallionName: stallion.name }))}`}
            className="inline-flex justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-4 text-white font-semibold transition"
          >
            {t("contact.emailButton")}
          </a>
        ) : null}

        {hasPhone ? (
          <a
            href={`tel:${breeder.phone}`}
            className="inline-flex justify-center rounded-xl border border-white/15 px-6 py-4 text-white font-semibold hover:border-blue-500 transition"
          >
            {t("contact.callButton", { phone: breeder.phone! })}
          </a>
        ) : null}

        {hasWebsite ? (
          <a
            href={breeder.website!.startsWith("http") ? breeder.website! : `https://${breeder.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center rounded-xl border border-white/15 px-6 py-4 text-white font-semibold hover:border-blue-500 transition"
          >
            {t("contact.websiteButton")}
          </a>
        ) : null}

        {!hasEmail && !hasPhone && !hasWebsite ? (
          <p className="text-gray-500">
            {t("contact.noContactDetails")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

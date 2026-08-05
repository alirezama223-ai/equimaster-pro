import { getActiveStallions } from "@/app/actions/stallions";
import { getStallionAge } from "@/app/lib/stallions";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function PremiumStallions() {
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");
  const { stallions } = await getActiveStallions();
  const featured = (stallions ?? []).slice(0, 4);

  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#081223] py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-12 sm:mb-16">
          <p className="uppercase tracking-[0.2em] text-blue-500 text-xs font-bold sm:tracking-[6px]">
            {t("premium.eyebrow")}
          </p>

          <h2 className="text-3xl font-black text-white mt-4 sm:text-5xl">{t("premium.title")}</h2>

          <p className="text-gray-400 mt-5 max-w-2xl mx-auto">
            {t("premium.subtitle")}
          </p>

          <Link
            href="/stallions"
            className="inline-flex mt-8 rounded-xl bg-blue-600 hover:bg-blue-500 px-8 py-4 text-white font-semibold transition"
          >
            {t("premium.browseDirectory")}
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {featured.map((stallion) => {
            const age = getStallionAge(stallion.birthYear);

            return (
              <div
                key={stallion.id}
                className="bg-[#111d33] rounded-3xl overflow-hidden border border-white/10 hover:border-blue-500 transition duration-300"
              >

                <div className="relative h-72">
                  <Image
                    src={stallion.coverImageUrl}
                    alt={t("premium.stallionImageAlt", { name: stallion.name })}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>

                <div className="p-6">

                  <h3 className="text-white font-bold text-xl">
                    {stallion.name}
                  </h3>

                  <p className="text-gray-400 mt-2">
                    {stallion.breed}
                  </p>

                  <div className="flex justify-between mt-6 text-sm text-gray-300">

                    <div>
                      <p>{t("premium.age")}</p>
                      <p className="font-bold text-white">
                        {age ?? tCommon("notApplicable")}
                      </p>
                    </div>

                    <div>
                      <p>{t("premium.studFee")}</p>
                      <p className="font-bold text-blue-400">
                        {stallion.studFeeLabel}
                      </p>
                    </div>

                  </div>

                  <Link
                    href={`/stallions/${stallion.id}`}
                    className="mt-6 block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition text-center"
                  >
                    {t("premium.viewStallion")}
                  </Link>

                </div>

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}

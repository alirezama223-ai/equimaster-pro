import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

const stallions = [
  {
    name: "Emerald van't Ruytershof",
    breed: "BWP",
    age: 16,
    fee: "€2,500",
    image: "/emi.jpg",
  },
  {
    name: "Ermitage Kalone",
    breed: "SBS",
    age: 11,
    fee: "€2,000",
    image: "/emi.jpg",
  },
  {
    name: "Chacco Blue",
    breed: "OS",
    age: 19,
    fee: "€3,500",
    image: "/emi.jpg",
  },
  {
    name: "Comme il Faut",
    breed: "Westfalian",
    age: 20,
    fee: "€2,200",
    image: "/emi.jpg",
  },
];

export default async function PremiumStallions() {
  const t = await getTranslations("home");

  return (
    <section className="bg-[#081223] py-28">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <p className="uppercase tracking-[6px] text-blue-500 text-xs font-bold">
            {t("premium.eyebrow")}
          </p>

          <h2 className="text-5xl font-black text-white mt-4">{t("premium.title")}</h2>

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

          {stallions.map((stallion) => (

            <div
              key={stallion.name}
              className="bg-[#111d33] rounded-3xl overflow-hidden border border-white/10 hover:border-blue-500 transition duration-300"
            >

              <div className="relative h-72">
                <Image
                  src={stallion.image}
                  alt={t("premium.stallionImageAlt", { name: stallion.name })}
                  fill
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
                      {stallion.age}
                    </p>
                  </div>

                  <div>
                    <p>{t("premium.studFee")}</p>
                    <p className="font-bold text-blue-400">
                      {stallion.fee}
                    </p>
                  </div>

                </div>

                <button className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition">
                  {t("premium.viewStallion")}
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}

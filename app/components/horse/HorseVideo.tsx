import { getTranslations } from "next-intl/server";
import { Horse } from "@/app/data/horses";
import { isDirectPlayableVideoUrl } from "@/app/lib/horse-video-storage";

type Props = {
  horse: Horse;
};

export default async function HorseVideo({ horse }: Props) {
  const t = await getTranslations("horse");

  if (!horse.videoUrl) {
    return null;
  }

  if (isDirectPlayableVideoUrl(horse.videoUrl)) {
    return (
      <section className="mt-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] lg:mt-0">
        <h2 className="px-5 pt-6 text-2xl font-bold sm:px-6 sm:text-3xl">{t("video.title")}</h2>
        <div className="mt-4 overflow-hidden sm:mt-6">
          <video
            src={horse.videoUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[720px] bg-black"
          >
            {t("video.unsupported")}
          </video>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] lg:mt-0">
      <h2 className="px-5 pt-6 text-2xl font-bold sm:px-6 sm:text-3xl">{t("video.title")}</h2>
      <div className="mt-4 p-5 sm:p-6">
        <p className="text-gray-400 mb-4">{t("video.externalLink")}</p>
        <a
          href={horse.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 transition"
        >
          {t("video.watchVideo")}
        </a>
      </div>
    </section>
  );
}

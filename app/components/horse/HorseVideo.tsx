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
      <section className="mt-20">
        <h2 className="text-3xl font-bold mb-6">{t("video.title")}</h2>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827]">
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
    <section className="mt-20">
      <h2 className="text-3xl font-bold mb-6">{t("video.title")}</h2>
      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6">
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

import { useTranslations } from "next-intl";
import Image from "next/image";
import { formatListingPrice } from "@/app/lib/listing-validation";
import { ListingFormData, ListingImage } from "@/app/types/listing";

type Props = {
  data: ListingFormData;
  images: ListingImage[];
  videoFile: File | null;
  videoPreviewUrl: string | null;
  existingVideoUrl?: string | null;
};

export default function ListingPreview({
  data,
  images,
  videoFile,
  videoPreviewUrl,
  existingVideoUrl,
}: Props) {
  const t = useTranslations("sell");
  const coverImage = images.find((image) => image.isCover) ?? images[0] ?? null;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#111827]">
        {coverImage ? (
          <div className="relative h-80">
            <Image
              src={coverImage.previewUrl}
              alt={data.name}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-blue-400 uppercase tracking-[4px] text-xs font-semibold">
                {t("preview.eyebrow")}
              </p>
              <h2 className="text-4xl font-black text-white mt-2">{data.name}</h2>
              <p className="text-gray-300 mt-2">
                {data.breed} · {data.country}
              </p>
            </div>
          </div>
        ) : null}

        <div className="p-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PreviewStat label={t("preview.age")} value={t("preview.ageValue", { age: data.age })} />
              <PreviewStat
                label={t("preview.height")}
                value={t("preview.heightValue", { height: data.height })}
              />
              <PreviewStat label={t("preview.gender")} value={data.gender} />
              <PreviewStat label={t("preview.color")} value={data.color} />
              <PreviewStat label={t("preview.discipline")} value={data.discipline} />
              <PreviewStat label={t("preview.level")} value={data.level} />
              <PreviewStat label={t("preview.sire")} value={data.sire} />
              <PreviewStat label={t("preview.dam")} value={data.dam} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">{t("preview.description")}</h3>
              <p className="text-gray-300 leading-7 whitespace-pre-wrap">{data.description}</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">{t("preview.pedigree")}</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <PreviewStat label={t("preview.sire")} value={data.sire} />
                <PreviewStat label={t("preview.dam")} value={data.dam} />
                <PreviewStat label={t("preview.damSire")} value={data.damSire} />
              </div>
            </div>

            {images.length > 1 ? (
              <div>
                <h3 className="text-xl font-bold text-white mb-3">{t("preview.gallery")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative h-28 overflow-hidden rounded-2xl border border-white/10"
                    >
                      <Image
                        src={image.previewUrl}
                        alt={t("preview.galleryAlt")}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {videoPreviewUrl || existingVideoUrl || data.videoUrl ? (
              <div>
                <h3 className="text-xl font-bold text-white mb-3">{t("preview.video")}</h3>
                {videoPreviewUrl ? (
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="w-full rounded-2xl border border-white/10"
                  />
                ) : existingVideoUrl ? (
                  <video
                    src={existingVideoUrl}
                    controls
                    className="w-full rounded-2xl border border-white/10"
                  />
                ) : (
                  <p className="text-blue-300 break-all">{data.videoUrl}</p>
                )}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-blue-500 p-8">
              <p className="text-gray-200 text-sm uppercase tracking-wide">{t("preview.price")}</p>
              <p className="text-5xl font-black text-white mt-2">{formatListingPrice(data)}</p>
            </div>

            <div className="rounded-3xl bg-[#08111F] border border-white/10 p-6 space-y-4">
              <h3 className="text-xl font-bold text-white">{t("preview.sellerContact")}</h3>
              <PreviewStat label={t("preview.name")} value={data.sellerName} />
              <PreviewStat label={t("preview.email")} value={data.email} />
              <PreviewStat label={t("preview.phone")} value={data.phone} />
              {data.stableName ? (
                <PreviewStat label={t("preview.stable")} value={data.stableName} />
              ) : null}
            </div>

            {videoFile ? (
              <p className="text-sm text-gray-400">
                {t("preview.videoSelected", { name: videoFile.name })}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#08111F] border border-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-white font-semibold mt-2">{value}</p>
    </div>
  );
}

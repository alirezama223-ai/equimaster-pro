import { Horse } from "@/app/data/horses";
import { isDirectPlayableVideoUrl } from "@/app/lib/horse-video-storage";

type Props = {
  horse: Horse;
};

export default function HorseVideo({ horse }: Props) {
  if (!horse.videoUrl) {
    return null;
  }

  if (isDirectPlayableVideoUrl(horse.videoUrl)) {
    return (
      <section className="mt-20">
        <h2 className="text-3xl font-bold mb-6">Video</h2>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111827]">
          <video
            src={horse.videoUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[720px] bg-black"
          >
            Your browser does not support HTML5 video playback.
          </video>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-20">
      <h2 className="text-3xl font-bold mb-6">Video</h2>
      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6">
        <p className="text-gray-400 mb-4">
          This listing includes an external video link.
        </p>
        <a
          href={horse.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 transition"
        >
          Watch Video
        </a>
      </div>
    </section>
  );
}

import { NextRequest } from "next/server";
import { SHABDIZ_HERO_VIDEO } from "@/app/components/hero/hero-video";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const base64 = SHABDIZ_HERO_VIDEO.split(",", 2)[1] ?? "";
const video = Buffer.from(base64, "base64");
const baseHeaders = {
  "Content-Type": "video/mp4",
  "Accept-Ranges": "bytes",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET(request: NextRequest) {
  const fileSize = video.length;
  const range = request.headers.get("range");

  if (!range) {
    return new Response(video, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(fileSize) },
    });
  }

  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) {
    return new Response("Invalid Range", {
      status: 416,
      headers: { ...baseHeaders, "Content-Range": `bytes */${fileSize}` },
    });
  }

  const start = match[1] ? Number(match[1]) : 0;
  const requestedEnd = match[2] ? Number(match[2]) : fileSize - 1;
  const end = Math.min(requestedEnd, fileSize - 1);

  if (start >= fileSize || start > end) {
    return new Response("Range Not Satisfiable", {
      status: 416,
      headers: { ...baseHeaders, "Content-Range": `bytes */${fileSize}` },
    });
  }

  const body = video.subarray(start, end + 1);
  return new Response(body, {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Length": String(body.length),
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    },
  });
}

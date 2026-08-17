import { NextRequest } from "next/server";
import { part01 } from "@/app/components/hero/video-parts/part01";
import { part02 } from "@/app/components/hero/video-parts/part02";
import { part03 } from "@/app/components/hero/video-parts/part03";
import { part04 } from "@/app/components/hero/video-parts/part04";
import { part05 } from "@/app/components/hero/video-parts/part05";
import { part06 } from "@/app/components/hero/video-parts/part06";
import { part07 } from "@/app/components/hero/video-parts/part07";
import { part08 } from "@/app/components/hero/video-parts/part08";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const base64 = [part01, part02, part03, part04, part05, part06, part07, part08].join("");
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
    return new Response(video, { status: 200, headers: { ...baseHeaders, "Content-Length": String(fileSize) } });
  }

  const match = range.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return new Response("Invalid Range", { status: 416, headers: { ...baseHeaders, "Content-Range": `bytes */${fileSize}` } });

  const start = match[1] ? Number(match[1]) : 0;
  const requestedEnd = match[2] ? Number(match[2]) : fileSize - 1;
  const end = Math.min(requestedEnd, fileSize - 1);

  if (start >= fileSize || start > end) return new Response("Range Not Satisfiable", { status: 416, headers: { ...baseHeaders, "Content-Range": `bytes */${fileSize}` } });

  const body = video.subarray(start, end + 1);
  return new Response(body, {
    status: 206,
    headers: { ...baseHeaders, "Content-Length": String(body.length), "Content-Range": `bytes ${start}-${end}/${fileSize}` },
  });
}

import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_PATH = path.join(process.cwd(), "public", "brand", "shabdiz-hero.mp4");

export async function GET(request: NextRequest) {
  try {
    const stat = await fs.stat(VIDEO_PATH);
    const fileSize = stat.size;
    const range = request.headers.get("range");
    const baseHeaders = {
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    };

    const file = await fs.readFile(VIDEO_PATH);

    if (!range) {
      return new Response(file, {
        status: 200,
        headers: { ...baseHeaders, "Content-Length": String(file.length) },
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

    const body = file.subarray(start, end + 1);
    return new Response(body, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(body.length),
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      },
    });
  } catch (error) {
    console.error("Hero video route failed:", error);
    return new Response("Hero video not found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

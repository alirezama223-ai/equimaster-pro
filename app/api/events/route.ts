import { NextResponse } from "next/server";
import { fetchLiveFEIEvents } from "@/app/components/news/LiveEvents";

export async function GET() {
  const events = await fetchLiveFEIEvents();
  return NextResponse.json(
    { events, source: "FEI", fetchedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=3600" } }
  );
}

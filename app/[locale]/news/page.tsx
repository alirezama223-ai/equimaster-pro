import Navbar from "@/app/components/navbar/Navbar";
import NewsEventsHub from "@/app/components/news/NewsEventsHub";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("news", "/news");
}

export default function NewsPage() {
  return (
    <>
      <Navbar />
      <NewsEventsHub />
    </>
  );
}

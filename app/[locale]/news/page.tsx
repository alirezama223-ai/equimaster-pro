import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import NewsEventsHub from "@/app/components/news/NewsEventsHub";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("news");
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: true, follow: true },
  };
}

export default function NewsPage() {
  return (
    <>
      <Navbar />
      <NewsEventsHub />
    </>
  );
}

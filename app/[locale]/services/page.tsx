import Navbar from "@/app/components/navbar/Navbar";
import EquiMarketServices from "@/app/components/services/EquiMarketServices";
import { getEquiMarketListings } from "@/app/actions/equimarket";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EquiMarket Services | Sport Horse Rentals & Wanted Horses",
  description: "Find sport horses for rent or publish a wanted-horse request on EquiMarket.",
};

export default async function ServicesPage() {
  const locale = await getLocale();
  const [{ listings: rentals }, { listings: wanted }] = await Promise.all([
    getEquiMarketListings("horse_rental"),
    getEquiMarketListings("horse_wanted"),
  ]);

  return (
    <>
      <Navbar />
      <EquiMarketServices locale={locale} rentals={rentals} wanted={wanted} />
    </>
  );
}

import Navbar from "@/app/components/navbar/Navbar";
import EquiMarketServices from "@/app/components/services/EquiMarketServices";
import { getEquiMarketListings } from "@/app/actions/equimarket";
import { getEquestrianServiceProviders } from "@/app/actions/equestrianServices";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Equestrian Services | Shabdiz",
  description: "Find riding schools, trainers and equestrian services near you.",
};

export default async function ServicesPage() {
  const locale = await getLocale();
  const [{ listings: rentals }, { listings: wanted }, { providers }] = await Promise.all([
    getEquiMarketListings("horse_rental"),
    getEquiMarketListings("horse_wanted"),
    getEquestrianServiceProviders(),
  ]);

  return (
    <>
      <Navbar />
      <EquiMarketServices locale={locale} rentals={rentals} wanted={wanted} providers={providers} />
    </>
  );
}

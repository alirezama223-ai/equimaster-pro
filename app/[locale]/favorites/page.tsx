import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import Navbar from "@/app/components/navbar/Navbar";
import FavoritesClient from "@/app/components/favorites/FavoritesClient";
import { getUserFavoriteHorses } from "@/app/actions/favorites";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("favorites", "/favorites");
}

export default async function FavoritesPage() {
  const result = await getUserFavoriteHorses();

  if (result.unauthenticated) {
    redirect(loginRedirectPath("/favorites"));
  }

  return (
    <>
      <Navbar />
      <FavoritesClient
        initialHorses={result.horses}
        initialFavoriteListingIds={result.favoriteListingIds}
      />
    </>
  );
}

import { slugifyListingName } from "@/app/lib/horse-listings";

export function buildListingSlug(name: string, listingId: string): string {
  const base = slugifyListingName(name) || "horse";
  const suffix = listingId.replace(/-/g, "").slice(0, 8).toLowerCase();
  return `${base}-${suffix}`;
}

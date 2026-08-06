import { formatOwnerReference } from "@/app/lib/format-owner-reference";
import { formatListingRowPrice } from "@/app/lib/horse-listings";
import type { AdminListingListItem } from "@/app/types/admin-panel";
import type { HorseListingRow } from "@/app/types/horse-listing";

export function mapListingRow(row: HorseListingRow, priceOnRequestLabel: string): AdminListingListItem {
  const extended = row as HorseListingRow & {
    rejection_reason?: string | null;
    featured?: boolean;
    hidden?: boolean;
  };

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sellerId: row.user_id,
    sellerName: row.seller_name,
    sellerReference: formatOwnerReference(row.user_id),
    breed: row.breed,
    country: row.country,
    status: row.status,
    verified: row.verified,
    featured: Boolean(extended.featured),
    hidden: Boolean(extended.hidden),
    rejectionReason: extended.rejection_reason ?? null,
    viewCount: row.view_count ?? 0,
    priceLabel: formatListingRowPrice(row, priceOnRequestLabel),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

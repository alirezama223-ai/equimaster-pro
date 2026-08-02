import {
  getListingEditPath,
  getListingPreviewPath,
  getPublicListingPath,
} from "@/app/lib/marketplace/paths";
import type { HorseListingRow, ListingStatus } from "@/app/types/horse-listing";

export type ListingActionKey =
  | "view"
  | "edit"
  | "duplicate"
  | "publish"
  | "unpublish"
  | "sold"
  | "archive"
  | "restore"
  | "delete";

export type ListingActionVariant = "default" | "primary" | "danger";

export type ListingActionDef = {
  key: ListingActionKey;
  variant: ListingActionVariant;
  href?: (listing: HorseListingRow) => string;
  requiresConfirm?: boolean;
  confirmKey?: "confirmDelete" | "confirmDefault";
};

const ACTION_DEFS: Record<ListingActionKey, Omit<ListingActionDef, "key">> = {
  view: {
    variant: "default",
    href: (listing) =>
      resolveListingStatus(listing) === "active" && listing.slug
        ? getPublicListingPath(listing.slug)
        : getListingPreviewPath(listing.id),
  },
  edit: {
    variant: "default",
    href: (listing) => getListingEditPath(listing.id),
  },
  duplicate: {
    variant: "default",
  },
  publish: {
    variant: "default",
  },
  unpublish: {
    variant: "default",
  },
  sold: {
    variant: "default",
  },
  archive: {
    variant: "default",
  },
  restore: {
    variant: "default",
  },
  delete: {
    variant: "danger",
    requiresConfirm: true,
    confirmKey: "confirmDelete",
  },
};

const ACTIONS_BY_STATUS: Record<ListingStatus, ListingActionKey[]> = {
  draft: ["edit", "publish", "delete"],
  active: ["view", "edit", "unpublish", "sold", "archive"],
  sold: ["view", "duplicate", "archive"],
  archived: ["restore", "delete"],
};

/** Legacy/display values mapped to canonical DB statuses. */
const LISTING_STATUS_ALIASES: Record<string, ListingStatus> = {
  published: "active",
  live: "active",
};

export type ListingStatusSource = Pick<HorseListingRow, "status" | "published_at">;

export function resolveListingStatus(listing: ListingStatusSource): ListingStatus {
  const raw = listing.status;

  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();

    if (normalized in ACTIONS_BY_STATUS) {
      return normalized as ListingStatus;
    }

    const aliased = LISTING_STATUS_ALIASES[normalized];
    if (aliased) {
      return aliased;
    }
  }

  if (listing.published_at) {
    return "active";
  }

  return "draft";
}

export function getListingActionsForStatus(status: ListingStatus): ListingActionDef[] {
  return ACTIONS_BY_STATUS[status].map((key) => ({
    key,
    ...ACTION_DEFS[key],
  }));
}

/** Primary action shown outside the menu (hidden for archived listings). */
export function getListingViewAction(listing: HorseListingRow): ListingActionDef | null {
  if (resolveListingStatus(listing) === "archived") {
    return null;
  }

  return {
    key: "view",
    ...ACTION_DEFS.view,
  };
}

/** All management actions for the three-dot menu (excludes View). */
export function getListingMenuActions(
  listingOrStatus: ListingStatusSource | ListingStatus | string | null | undefined
): ListingActionDef[] {
  const status =
    typeof listingOrStatus === "object" && listingOrStatus !== null
      ? resolveListingStatus(listingOrStatus)
      : resolveListingStatus({
          status: (listingOrStatus ?? undefined) as ListingStatus,
          published_at: null,
        });

  const keys = ACTIONS_BY_STATUS[status];

  return keys
    .filter((key) => key !== "view")
    .map((key) => ({
      key,
      ...ACTION_DEFS[key],
    }));
}

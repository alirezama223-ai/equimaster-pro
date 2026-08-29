export type NavLinkKey =
  | "home"
  | "marketplace"
  | "browse"
  | "browseHorses"
  | "favorites"
  | "stallions"
  | "breeders"
  | "bloodlines"
  | "breedingLab"
  | "training"
  | "news"
  | "stallionMatch"
  | "sell"
  | "sellAHorse"
  | "sellerDashboard"
  | "about";

export type NavLinkItem = {
  href: string;
  labelKey: NavLinkKey | "favoritesWithIcon";
  accent?: "red" | "blue";
};

/** Primary routes shown in the desktop inline bar (Sell uses the right-side CTA instead). */
export const DESKTOP_INLINE_NAV_LINKS: NavLinkItem[] = [
  { href: "/", labelKey: "home" },
  { href: "/marketplace", labelKey: "marketplace" },
  { href: "/horses", labelKey: "browse" },
  { href: "/favorites", labelKey: "favoritesWithIcon", accent: "red" },
  { href: "/stallions", labelKey: "stallions" },
  { href: "/breeders", labelKey: "breeders" },
  { href: "/bloodlines", labelKey: "bloodlines" },
  { href: "/breeding-lab", labelKey: "breedingLab" },
  { href: "/training", labelKey: "training" },
  { href: "/news", labelKey: "news", accent: "blue" },
  { href: "/breeding-recommendations", labelKey: "stallionMatch" },
];

/** Full route list for compact desktop/mobile menu. */
export const FULL_NAV_LINKS: NavLinkItem[] = [
  { href: "/", labelKey: "home" },
  { href: "/favorites", labelKey: "favorites", accent: "red" },
  { href: "/sell", labelKey: "sellAHorse", accent: "blue" },
  { href: "/marketplace", labelKey: "marketplace" },
  { href: "/horses", labelKey: "browseHorses" },
  { href: "/news", labelKey: "news", accent: "blue" },
  { href: "/dashboard/seller", labelKey: "sellerDashboard" },
  { href: "/stallions", labelKey: "stallions" },
  { href: "/breeders", labelKey: "breeders" },
  { href: "/bloodlines", labelKey: "bloodlines" },
  { href: "/breeding-lab", labelKey: "breedingLab" },
  { href: "/training", labelKey: "training" },
  { href: "/breeding-recommendations", labelKey: "stallionMatch" },
  { href: "#", labelKey: "about" },
];

export function navLinkClassName(link: NavLinkItem, base = "whitespace-nowrap transition") {
  if (link.accent === "red") return `${base} hover:text-red-400`;
  if (link.accent === "blue") return `${base} hover:text-blue-400`;
  return `${base} hover:text-white`;
}

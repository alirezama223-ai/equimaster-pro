export type NavLinkItem = {
  href: string;
  label: string;
  accent?: "red" | "blue";
};

/** Primary routes shown in the desktop inline bar (Sell uses the right-side CTA instead). */
export const DESKTOP_INLINE_NAV_LINKS: NavLinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/favorites", label: "Favorites", accent: "red" },
  { href: "/stallions", label: "Stallions" },
  { href: "/breeders", label: "Breeders" },
  { href: "/bloodlines", label: "Bloodlines" },
  { href: "/breeding-lab", label: "Breeding Lab" },
  { href: "/breeding-recommendations", label: "Stallion Match" },
];

/** Full route list for compact desktop/mobile menu. */
export const FULL_NAV_LINKS: NavLinkItem[] = [
  { href: "/", label: "Home" },
  { href: "/favorites", label: "Favorites", accent: "red" },
  { href: "/sell", label: "Sell a Horse", accent: "blue" },
  { href: "#", label: "Browse" },
  { href: "/stallions", label: "Stallions" },
  { href: "/breeders", label: "Breeders" },
  { href: "/bloodlines", label: "Bloodlines" },
  { href: "/breeding-lab", label: "Breeding Lab" },
  { href: "/breeding-recommendations", label: "Stallion Match" },
  { href: "#", label: "About" },
];

export function navLinkClassName(link: NavLinkItem, base = "whitespace-nowrap transition") {
  if (link.accent === "red") return `${base} hover:text-red-400`;
  if (link.accent === "blue") return `${base} hover:text-blue-400`;
  return `${base} hover:text-white`;
}

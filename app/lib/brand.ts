export const SHABDIZ_BRAND = {
  name: "SHABDIZ",
  descriptor: "EQUINE MARKETPLACE",
  tagline: "CONNECT · TRADE · BREED · GROW",
  description: "Global equestrian marketplace",
  logo: "/brand/shabdiz-logo.svg",
  mark: "/brand/shabdiz-mark.svg",
  icon: "/icon.svg",
  appleIcon: "/apple-icon.svg",
  ogImage: "/brand/shabdiz-og.svg",
  colors: {
    navy: "#0B1E3A",
    gold: "#D4A437",
    goldLight: "#F7E1A1",
  },
} as const;

export type ShabdizBrand = typeof SHABDIZ_BRAND;

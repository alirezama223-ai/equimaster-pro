import type { MetadataRoute } from "next";

const PUBLIC_BRAND = "SHABDIZ";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PUBLIC_BRAND,
    short_name: PUBLIC_BRAND,
    description: "Global equestrian marketplace",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1E3A",
    theme_color: "#0B1E3A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}

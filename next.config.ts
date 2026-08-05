import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

function getSupabaseImageHostname(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;

  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

const supabaseHostname = getSupabaseImageHostname();

const imageConfig: NonNullable<NextConfig["images"]> = {
  formats: ["image/avif", "image/webp"],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 30,
  ...(supabaseHostname
    ? {
        remotePatterns: [
          {
            protocol: "https" as const,
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/horse-images/**",
          },
          {
            protocol: "https" as const,
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/stallion-images/**",
          },
          {
            protocol: "https" as const,
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/breeder-images/**",
          },
        ],
      }
    : {}),
};

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1 MB — too small for real horse photo uploads in FormData.
    serverActions: {
      bodySizeLimit: "128mb",
    },
    // Proxy reads the request body before server actions; default is 10 MB.
    proxyClientMaxBodySize: "128mb",
  },
  images: imageConfig,
};

export default withNextIntl(nextConfig);

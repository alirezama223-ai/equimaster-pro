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

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1 MB — too small for real horse photo uploads in FormData.
    serverActions: {
      bodySizeLimit: "128mb",
    },
    // Proxy reads the request body before server actions; default is 10 MB.
    proxyClientMaxBodySize: "128mb",
  },
  images: supabaseHostname
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/horse-images/**",
          },
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/stallion-images/**",
          },
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/breeder-images/**",
          },
        ],
      }
    : undefined,
};

export default withNextIntl(nextConfig);

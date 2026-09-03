import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/app/lib/supabase/env";

function getServiceKeyClaims(key: string) {
  try {
    const parts = key.split(".");
    if (parts.length !== 3) return { format: "not-jwt" };
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
    return {
      ref: typeof payload.ref === "string" ? payload.ref : null,
      role: typeof payload.role === "string" ? payload.role : null,
      iss: typeof payload.iss === "string" ? payload.iss : null,
    };
  } catch {
    return { format: "decode-failed" };
  }
}

export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  const { url } = getSupabaseEnv();
  console.info("[supabase-service] Runtime configuration:", {
    host: (() => {
      try {
        return new URL(url).host;
      } catch {
        return "invalid-url";
      }
    })(),
    keyClaims: getServiceKeyClaims(serviceRoleKey),
  });

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

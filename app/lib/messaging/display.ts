export function getParticipantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function resolveDisplayName(
  metadata: Record<string, unknown> | undefined,
  email: string | undefined,
  fallback: string
): string {
  const fullName = typeof metadata?.full_name === "string" ? metadata.full_name.trim() : "";
  if (fullName) return fullName;

  const emailLocal = email?.split("@")[0]?.trim();
  if (emailLocal) return emailLocal;

  return fallback;
}

export function formatOwnerReference(ownerId: string): string {
  const normalized = ownerId.trim();
  if (normalized.length <= 12) {
    return normalized;
  }

  return `${normalized.slice(0, 8)}…`;
}

const APP_PATH_PATTERN = /^\/[\w\-/.%]*$/;
const MAX_APP_PATH_LENGTH = 500;

/** Validates user-supplied in-app paths (feedback page_path, redirects). */
export function sanitizeAppPath(path: string): string | null {
  const trimmed = path.trim();

  if (!trimmed || trimmed.length > MAX_APP_PATH_LENGTH) {
    return null;
  }

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (!APP_PATH_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

const LISTING_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_LISTING_SLUG_LENGTH = 120;

export function isValidListingSlug(slug: string): boolean {
  const trimmed = slug.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= MAX_LISTING_SLUG_LENGTH &&
    LISTING_SLUG_PATTERN.test(trimmed)
  );
}

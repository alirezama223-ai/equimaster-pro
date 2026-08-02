export type ListingActionErrorKey =
  | "notAuthenticated"
  | "publishNotFound"
  | "publishNoPhotos"
  | "publishNoHorseRecord"
  | "publishFailed"
  | "unpublishFailed"
  | "markSoldFailed"
  | "archiveFailed"
  | "restoreNotFound"
  | "duplicateNotFound"
  | "duplicatePhotosFailed"
  | "duplicateFinalizeFailed"
  | "duplicateFailed"
  | "deleteFailed"
  | "generic";

export type ListingActionResult = {
  error?: string;
  errorKey?: ListingActionErrorKey | (string & {});
};

export function resolveListingActionError(
  result: ListingActionResult,
  translate: (key: string) => string
): string | undefined {
  if (result.errorKey) {
    return translate(`errors.${result.errorKey}`);
  }

  return result.error;
}

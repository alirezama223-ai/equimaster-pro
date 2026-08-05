import type { BreedingMethod } from "@/app/types/stallion";

/** Maps stored breeding method values to stallions.breedingMethods message keys. */
export const BREEDING_METHOD_I18N_KEY: Record<BreedingMethod, string> = {
  "Fresh semen": "freshSemen",
  "Chilled semen": "chilledSemen",
  "Frozen semen": "frozenSemen",
  "Natural covering": "naturalCovering",
};

export function breedingMethodLabelKey(method: string): string | null {
  return BREEDING_METHOD_I18N_KEY[method as BreedingMethod] ?? null;
}

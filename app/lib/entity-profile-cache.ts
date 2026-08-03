import { cache } from "react";
import { getBreederById } from "@/app/actions/breeders";
import { getStallionById } from "@/app/actions/stallions";

export const getCachedStallionById = cache(getStallionById);

export const getCachedBreederById = cache(getBreederById);

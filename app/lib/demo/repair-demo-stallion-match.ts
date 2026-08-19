import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { TRAIT_CATALOG } from "@/app/lib/traits/catalog";

// Keep Demo pedigrees deep enough to exercise ancestor matching without generating
// an unreadable wall of synthetic cards in the Breeding Lab.
const DEMO_DEPTH = 3;
const DEMO_STALLION_PREFIX = "SHABDIZ Demo ";
const MIN_DEMO_ASSESSMENTS_PER_TRAIT = 4;
const DEMO_BASE_SCORES: Record<string, number> = {
  "SHABDIZ Demo Alpha": 5,
  "SHABDIZ Demo Bravo": 4,
  "SHABDIZ Demo Charlie": 3,
  "SHABDIZ Demo Delta": 5,
  "SHABDIZ Demo Echo": 4,
  Bella: 3,
};

type DemoRoot = { id: string; name: string; sex: "mare" | "stallion"; birth
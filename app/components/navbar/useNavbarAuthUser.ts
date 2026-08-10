"use client";

import { useSyncExternalStore } from "react";
import {
  getNavbarAuthSnapshot,
  subscribeNavbarAuth,
} from "@/app/components/navbar/navbarAuthStore";

export function useNavbarAuthUser() {
  return useSyncExternalStore(
    subscribeNavbarAuth,
    getNavbarAuthSnapshot,
    getNavbarAuthSnapshot
  );
}

"use client";

import { useEffect } from "react";
import {
  installMobileNavGlobalExceptionHandlers,
  isMobileNavDiagEnabled,
  logMobileNavSessionState,
  mobileNavLog,
} from "@/app/lib/debug/mobile-nav-diagnostics";
import type { MobileNavSessionSnapshot } from "@/app/lib/debug/mobile-nav-diagnostics";

type Props = {
  session: MobileNavSessionSnapshot;
};

/** Captures the first client exception after login on mobile (diagnostic only). */
export default function MobileNavExceptionProbe({ session }: Props) {
  useEffect(() => {
    if (!isMobileNavDiagEnabled()) {
      return;
    }

    return installMobileNavGlobalExceptionHandlers();
  }, []);

  useEffect(() => {
    if (!isMobileNavDiagEnabled()) {
      return;
    }

    logMobileNavSessionState("auth-state-change", session);
  }, [session.drawerOpen, session.isAdmin, session.isLoading, session.userId]);

  useEffect(() => {
    if (!isMobileNavDiagEnabled()) {
      return;
    }

    mobileNavLog("mobile-nav-probe-mounted", {
      userId: session.userId,
      isLoading: session.isLoading,
      drawerOpen: session.drawerOpen,
    });
  }, [session.drawerOpen, session.isLoading, session.userId]);

  return null;
}

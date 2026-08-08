"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useRef } from "react";
import {
  isMobileNavDiagEnabled,
  mobileNavLog,
} from "@/app/lib/debug/mobile-nav-diagnostics";
import { subscribeMobileDrawerOpen } from "@/app/components/navbar/mobileDrawerState";

type AuthSnapshot = {
  userId: string | null;
  isLoading: boolean;
};

type Props = {
  drawerOpen: boolean;
  auth: AuthSnapshot;
};

let historyPatched = false;
let locationPatched = false;

function patchHistoryNavigation() {
  if (historyPatched || typeof window === "undefined") {
    return;
  }

  historyPatched = true;
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = (...args) => {
    mobileNavLog("history.pushState", {
      state: args[0],
      title: args[1],
      url: args[2],
    });
    return originalPushState(...args);
  };

  history.replaceState = (...args) => {
    mobileNavLog("history.replaceState", {
      state: args[0],
      title: args[1],
      url: args[2],
    });
    return originalReplaceState(...args);
  };
}

function patchLocationNavigation() {
  if (locationPatched || typeof window === "undefined") {
    return;
  }

  locationPatched = true;
  const locationProto = window.Location.prototype;
  const originalAssign = locationProto.assign;
  const originalReplace = locationProto.replace;

  locationProto.assign = function assign(url: string | URL) {
    mobileNavLog("window.location.assign", { url: String(url) });
    return originalAssign.call(this, url);
  };

  locationProto.replace = function replace(url: string | URL) {
    mobileNavLog("window.location.replace", { url: String(url) });
    return originalReplace.call(this, url);
  };
}

export default function MobileNavDiagnostics({ drawerOpen, auth }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const authRef = useRef(auth);
  const drawerOpenRef = useRef(drawerOpen);
  const pathnameRef = useRef(pathname);

  authRef.current = auth;
  drawerOpenRef.current = drawerOpen;
  pathnameRef.current = pathname;

  useEffect(() => {
    if (!isMobileNavDiagEnabled()) {
      return;
    }

    patchHistoryNavigation();
    patchLocationNavigation();

    mobileNavLog("diagnostics-mounted", {
      pathname,
      drawerOpen,
      userId: auth.userId,
      isLoading: auth.isLoading,
    });
  }, [auth.isLoading, auth.userId, drawerOpen, pathname]);

  useEffect(() => {
    if (!isMobileNavDiagEnabled()) {
      return;
    }

    type RouterWithNav = ReturnType<typeof useRouter> & {
      push: (...args: unknown[]) => unknown;
      replace: (...args: unknown[]) => unknown;
      refresh: () => void;
    };

    const instrumented = router as RouterWithNav;
    const originalPush = instrumented.push.bind(instrumented);
    const originalReplace = instrumented.replace.bind(instrumented);
    const originalRefresh = instrumented.refresh.bind(instrumented);

    instrumented.push = (...args: unknown[]) => {
      mobileNavLog("router.push", {
        args,
        pathname: pathnameRef.current,
        drawerOpen: drawerOpenRef.current,
      });
      return originalPush(...(args as Parameters<typeof originalPush>));
    };

    instrumented.replace = (...args: unknown[]) => {
      mobileNavLog("router.replace", {
        args,
        pathname: pathnameRef.current,
        drawerOpen: drawerOpenRef.current,
      });
      return originalReplace(...(args as Parameters<typeof originalReplace>));
    };

    instrumented.refresh = () => {
      mobileNavLog("router.refresh", {
        pathname: pathnameRef.current,
        drawerOpen: drawerOpenRef.current,
      });
      return originalRefresh();
    };

    return () => {
      instrumented.push = originalPush;
      instrumented.replace = originalReplace;
      instrumented.refresh = originalRefresh;
    };
  }, [router]);

  useEffect(() => {
    if (!isMobileNavDiagEnabled()) {
      return;
    }

    return subscribeMobileDrawerOpen((open) => {
      mobileNavLog("drawer-state-change", {
        open,
        pathname: pathnameRef.current,
        userId: authRef.current.userId,
        isLoading: authRef.current.isLoading,
      });
    });
  }, []);

  useEffect(() => {
    if (!isMobileNavDiagEnabled()) {
      return;
    }

    mobileNavLog("pathname-change", {
      pathname,
      drawerOpen: drawerOpenRef.current,
    });
  }, [pathname]);

  useEffect(() => {
    if (!isMobileNavDiagEnabled()) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const dialog = anchor.closest('[role="dialog"]');
      if (!dialog) {
        return;
      }

      mobileNavLog("link-click-capture", {
        phase: "capture",
        href: anchor.getAttribute("href"),
        defaultPrevented: event.defaultPrevented,
        pathname: pathnameRef.current,
        destinationPathname: anchor.pathname,
        drawerOpen: drawerOpenRef.current,
        userId: authRef.current.userId,
        isLoading: authRef.current.isLoading,
      });
    }

    function handleDocumentClickBubble(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const dialog = anchor.closest('[role="dialog"]');
      if (!dialog) {
        return;
      }

      mobileNavLog("link-click-bubble", {
        phase: "bubble",
        href: anchor.getAttribute("href"),
        defaultPrevented: event.defaultPrevented,
        linkNavigationLikely: !event.defaultPrevented,
        pathname: pathnameRef.current,
        destinationPathname: anchor.pathname,
        drawerOpen: drawerOpenRef.current,
        userId: authRef.current.userId,
        isLoading: authRef.current.isLoading,
      });

      if (!event.defaultPrevented) {
        mobileNavLog("link-navigation-fired", {
          href: anchor.getAttribute("href"),
          destinationPathname: anchor.pathname,
          note: "default not prevented — Link soft navigation may proceed",
        });
      }
    }

    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("click", handleDocumentClickBubble, false);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      document.removeEventListener("click", handleDocumentClickBubble, false);
    };
  }, []);

  return null;
}

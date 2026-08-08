/** Temporary mobile-nav exception probe — remove after root cause is confirmed. */

const PREFIX = "[mobile-nav-diag]";
const EXCEPTION_PREFIX = "[mobile-nav-diag:exception]";

let clientSeq = 0;

type DebugLineListener = (line: string) => void;

const debugLineListeners = new Set<DebugLineListener>();

export type MobileNavFirstException = {
  source: string;
  message: string;
  stack: string | undefined;
  iso: string;
  seq: number;
};

let firstException: MobileNavFirstException | null = null;

export function isMobileNavDiagEnabled(): boolean {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    return true;
  }

  return process.env.NEXT_PUBLIC_MOBILE_NAV_DIAG === "1";
}

export function subscribeMobileNavDebugLines(
  listener: DebugLineListener
): () => void {
  debugLineListeners.add(listener);
  return () => {
    debugLineListeners.delete(listener);
  };
}

export function appendMobileNavDebugLine(line: string): void {
  if (!isMobileNavDiagEnabled()) {
    return;
  }

  debugLineListeners.forEach((listener) => {
    listener(line);
  });
}

export function getFirstMobileNavException(): MobileNavFirstException | null {
  return firstException;
}

export function mobileNavLog(
  event: string,
  data?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || !isMobileNavDiagEnabled()) {
    return;
  }

  clientSeq += 1;
  console.log(PREFIX, {
    seq: clientSeq,
    ts: performance.now(),
    iso: new Date().toISOString(),
    event,
    pageHref: window.location.href,
    firstExceptionRecorded: Boolean(firstException),
    ...data,
  });
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === "string" ? error : JSON.stringify(error));
}

export function mobileNavLogException(
  source: string,
  error: unknown,
  data?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || !isMobileNavDiagEnabled()) {
    return;
  }

  clientSeq += 1;
  const normalized = normalizeError(error);

  if (!firstException) {
    firstException = {
      source,
      message: normalized.message,
      stack: normalized.stack,
      iso: new Date().toISOString(),
      seq: clientSeq,
    };
  }

  console.error(error);
  appendMobileNavDebugLine(`ERROR: ${normalized.message}`);
  if (normalized.stack) {
    appendMobileNavDebugLine(normalized.stack);
  }

  console.error(EXCEPTION_PREFIX, {
    seq: clientSeq,
    iso: new Date().toISOString(),
    source,
    message: normalized.message,
    stack: normalized.stack,
    isFirstException: firstException.seq === clientSeq,
    pageHref: window.location.href,
    ...data,
  });
}

export function runMobileNavInstrumented<T>(
  source: string,
  fn: () => T,
  data?: Record<string, unknown>
): T {
  mobileNavLog("click-starts", { source, ...data });

  try {
    return fn();
  } catch (error) {
    mobileNavLogException(source, error, data);
    throw error;
  }
}

export type MobileNavSessionSnapshot = {
  userId: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  drawerOpen: boolean;
};

export function sessionDebugValue(session: MobileNavSessionSnapshot | undefined): string {
  if (!session) {
    return "unknown";
  }

  if (session.isLoading) {
    return "loading";
  }

  return session.userId ? "true" : "false";
}

export function logMobileNavStart(
  href: string,
  session: MobileNavSessionSnapshot | undefined
): void {
  console.log("NAV START", href);
  console.log("SESSION", session);

  appendMobileNavDebugLine("NAV START");
  appendMobileNavDebugLine(`href=${href}`);
  appendMobileNavDebugLine(`session=${sessionDebugValue(session)}`);
}

export function logMobileNavSessionState(
  source: string,
  session: MobileNavSessionSnapshot,
  extra?: Record<string, unknown>
): void {
  mobileNavLog("session-state", {
    source,
    userId: session.userId,
    isLoading: session.isLoading,
    isAdmin: session.isAdmin,
    drawerOpen: session.drawerOpen,
    hasUser: Boolean(session.userId),
    ...extra,
  });
}

export function logMobileNavDrawerClose(): void {
  if (typeof window === "undefined" || !isMobileNavDiagEnabled()) {
    return;
  }

  console.log("DRAWER CLOSE");
  appendMobileNavDebugLine("drawer closing");
}

export function logMobileNavHardNavigation(method: string, target: string): void {
  appendMobileNavDebugLine(`${method}=${target}`);
}

export function logMobileNavDrawerState(
  source: string,
  drawerOpen: boolean,
  session: MobileNavSessionSnapshot,
  extra?: Record<string, unknown>
): void {
  if (!drawerOpen) {
    logMobileNavDrawerClose();
  } else {
    appendMobileNavDebugLine("drawer opening");
  }

  mobileNavLog(drawerOpen ? "drawer-open" : "drawer-close", {
    source,
    drawerOpen,
    userId: session.userId,
    isLoading: session.isLoading,
    ...extra,
  });
}

let locationNavigationPatched = false;

export function patchMobileNavLocationNavigation(): void {
  if (locationNavigationPatched || typeof window === "undefined") {
    return;
  }

  if (!isMobileNavDiagEnabled()) {
    return;
  }

  locationNavigationPatched = true;
  const locationProto = window.Location.prototype;
  const originalAssign = locationProto.assign;
  const originalReplace = locationProto.replace;

  locationProto.assign = function assign(url: string | URL) {
    const target = String(url);
    logMobileNavHardNavigation("window.location.assign", target);
    return originalAssign.call(this, url);
  };

  locationProto.replace = function replace(url: string | URL) {
    const target = String(url);
    logMobileNavHardNavigation("window.location.replace", target);
    return originalReplace.call(this, url);
  };

  appendMobileNavDebugLine("location navigation probe installed");
}

export function installMobileNavGlobalExceptionHandlers(): () => void {
  if (typeof window === "undefined" || !isMobileNavDiagEnabled()) {
    return () => {};
  }

  patchMobileNavLocationNavigation();

  function onWindowError(event: ErrorEvent) {
    mobileNavLogException("window.error", event.error ?? event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  }

  function onUnhandledRejection(event: PromiseRejectionEvent) {
    mobileNavLogException("window.unhandledrejection", event.reason, {
      promise: String(event.promise),
    });
  }

  window.addEventListener("error", onWindowError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  mobileNavLog("global-exception-handlers-installed");
  appendMobileNavDebugLine("global exception handlers installed");

  return () => {
    window.removeEventListener("error", onWindowError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}

/** @deprecated middleware logging lives in proxy; kept for existing imports. */
export function middlewareNavLog(
  event: string,
  data?: Record<string, unknown>
): void {
  if (!isMobileNavDiagEnabled()) {
    return;
  }

  console.log("[mobile-nav-diag:middleware]", {
    ts: new Date().toISOString(),
    event,
    ...data,
  });
}

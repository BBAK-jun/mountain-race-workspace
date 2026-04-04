export type RouteGuardSnapshot = {
  setupComplete: boolean;
  hasResult: boolean;
};

const ROUTE_GUARD_STORAGE_KEY = "mountain-race-route-guards-v1";

const DEFAULT_GUARD_SNAPSHOT: RouteGuardSnapshot = {
  setupComplete: false,
  hasResult: false,
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function readRouteGuardSnapshot(): RouteGuardSnapshot {
  if (!isBrowser()) {
    return DEFAULT_GUARD_SNAPSHOT;
  }

  const rawValue = window.sessionStorage.getItem(ROUTE_GUARD_STORAGE_KEY);

  if (!rawValue) {
    return DEFAULT_GUARD_SNAPSHOT;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<RouteGuardSnapshot>;

    return {
      setupComplete: Boolean(parsed.setupComplete),
      hasResult: Boolean(parsed.hasResult),
    };
  } catch {
    return DEFAULT_GUARD_SNAPSHOT;
  }
}

export function writeRouteGuardSnapshot(nextValue: Partial<RouteGuardSnapshot>) {
  if (!isBrowser()) {
    return;
  }

  const currentValue = readRouteGuardSnapshot();
  const mergedValue: RouteGuardSnapshot = {
    ...currentValue,
    ...nextValue,
  };

  window.sessionStorage.setItem(ROUTE_GUARD_STORAGE_KEY, JSON.stringify(mergedValue));
}

export function markSetupComplete() {
  writeRouteGuardSnapshot({ setupComplete: true, hasResult: false });
}

export function markResultReady() {
  writeRouteGuardSnapshot({ hasResult: true });
}

export function resetRouteGuardSnapshot() {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(ROUTE_GUARD_STORAGE_KEY);
}

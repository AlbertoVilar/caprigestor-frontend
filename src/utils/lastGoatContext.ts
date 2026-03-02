import { buildGoatDetailPath } from "./appRoutes";

const STORAGE_KEY = "caprigestor:last-goat-context";

type LastGoatContext = {
  farmId: string;
  goatId: string;
};

type LegacyDashboardOptions = {
  farmId?: string | null;
  goatId?: string | null;
  registrationNumber?: string | null;
};

const isValidContext = (value: unknown): value is LastGoatContext => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.farmId === "string" &&
    candidate.farmId.trim().length > 0 &&
    typeof candidate.goatId === "string" &&
    candidate.goatId.trim().length > 0
  );
};

const readStoredContext = (): LastGoatContext | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    window.sessionStorage.getItem(STORAGE_KEY) ??
    window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return isValidContext(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveLastGoatContext = (
  farmId: string | number,
  goatId: string | number
): void => {
  if (typeof window === "undefined") {
    return;
  }

  const value = JSON.stringify({
    farmId: String(farmId),
    goatId: String(goatId),
  });

  window.sessionStorage.setItem(STORAGE_KEY, value);
  window.localStorage.setItem(STORAGE_KEY, value);
};

export const loadLastGoatContext = (): LastGoatContext | null => readStoredContext();

export const resolveLegacyDashboardPath = (
  options: LegacyDashboardOptions = {}
): string => {
  const farmId = options.farmId?.trim();
  const goatId = options.goatId?.trim() || options.registrationNumber?.trim();

  if (farmId && goatId) {
    return buildGoatDetailPath(farmId, goatId);
  }

  const stored = readStoredContext();

  if (stored) {
    return buildGoatDetailPath(stored.farmId, stored.goatId);
  }

  return "/goatfarms";
};

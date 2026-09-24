const encodePathSegment = (value: string | number): string =>
  encodeURIComponent(String(value));

/** Explicit vocabulary for internal structural GoatId references. */
export const buildGoatTechnicalToken = (technicalId: string | number): string =>
  `technical-${String(technicalId)}`;

/** Validates that a token strictly follows the canonical structural technical token format: technical-{positive safe integer}. */
export const isValidGoatTechnicalToken = (token: unknown): token is string => {
  if (typeof token !== "string") return false;
  const match = token.trim().match(/^technical-(\d+)$/);
  if (!match) return false;
  const idNum = Number(match[1]);
  return Number.isSafeInteger(idNum) && idNum > 0;
};

/** Prefer the immutable id for internal links; fall back to the RG for legacy data. */
export const resolveGoatInternalRouteId = (goat: {
  technicalId?: string | number | null;
  id?: string | number | null;
  registrationNumber?: string | null;
}): string => {
  const technicalId = goat.technicalId ?? goat.id;
  return technicalId != null && String(technicalId).trim() !== ""
    ? buildGoatTechnicalToken(technicalId)
    : String(goat.registrationNumber ?? "");
};

const parseFarmId = (value: string | null | undefined): number | undefined => {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const farmId = Number(value);
  return Number.isSafeInteger(farmId) && farmId > 0 ? farmId : undefined;
};

export const resolveFarmContextId = (pathname: string, search = ""): number | undefined => {
  const routeMatch = pathname.match(/^\/app\/goatfarms\/(\d+)(?:\/|$)/);
  const routeFarmId = parseFarmId(routeMatch?.[1]);
  if (routeFarmId) return routeFarmId;

  return parseFarmId(new URLSearchParams(search).get("farmId"));
};

type LoginReturnLocation = {
  pathname?: unknown;
  search?: unknown;
  hash?: unknown;
};

/** Returns only an explicit trusted return destination, or undefined when absent/invalid. */
export const resolveExplicitLoginDestination = (from: unknown): string | undefined => {
  if (!from || typeof from !== "object") return undefined;
  const location = from as LoginReturnLocation;
  const pathname = location.pathname;
  const search = location.search;
  const hash = location.hash;
  if (
    typeof pathname !== "string" || !pathname.startsWith("/") ||
    pathname.startsWith("//") || pathname.includes("\\")
  ) return undefined;
  if (
    (search !== undefined && (typeof search !== "string" || (search !== "" && !search.startsWith("?")))) ||
    (hash !== undefined && (typeof hash !== "string" || (hash !== "" && !hash.startsWith("#"))))
  ) return undefined;
  return `${pathname}${typeof search === "string" ? search : ""}${typeof hash === "string" ? hash : ""}`;
};

/**
 * Resolves the internal destination carried by PrivateRoute after authentication.
 * Only React Router location-shaped values rooted at a single internal slash are accepted.
 */
export const resolveLoginDestination = (
  from: unknown,
  fallback = "/fazendas"
): string => {
  return resolveExplicitLoginDestination(from) ?? fallback;
};

export const buildManagedFarmsPath = (): string => "/app/goatfarms";

export const buildFarmDashboardPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/dashboard`;

export const buildFarmInventoryPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/inventory`;

export const buildFarmCommercialPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/commercial`;

export const buildFarmReportsPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/reports`;

export const buildFarmMilkConsolidatedPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/milk-consolidated`;

export const buildFarmAlertsPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/alerts`;

export const buildFarmHealthAgendaPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/health-agenda`;

export const buildFarmOwnershipTransfersPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/ownership-transfers`;

export const buildFarmGoatRegistryPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/registry`;

export const buildFarmGoatRegistryHistoricalDossierPath = (
  farmId: string | number,
  technicalGoatId: string | number
): string => {
  const token = String(technicalGoatId).startsWith("technical-")
    ? String(technicalGoatId)
    : buildGoatTechnicalToken(technicalGoatId);
  return `/app/goatfarms/${encodePathSegment(farmId)}/registry/${encodePathSegment(token)}`;
};

export const buildFarmGoatsPath = (farmId: string | number): string =>
  `/cabras?farmId=${encodePathSegment(farmId)}`;

/** Authenticated farm-workspace herd route; the public catalog path above is
 * intentionally preserved for anonymous/public links. */
export const buildFarmWorkspaceGoatsPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/goats`;

export const buildPublicFarmPath = (farmId: string | number): string =>
  `/fazendas/${encodePathSegment(farmId)}`;

export const buildPublicGoatDetailPath = (
  farmId: string | number,
  goatId: string | number
): string =>
  `${buildPublicFarmPath(farmId)}/animais/${encodePathSegment(goatId)}`;

export const buildGoatDetailPath = (
  farmId: string | number,
  goatId: string | number
): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/goats/${encodePathSegment(goatId)}`;

export const buildGoatHealthPath = (
  farmId: string | number,
  goatId: string | number
): string =>
  `${buildGoatDetailPath(farmId, goatId)}/health`;

export const buildGoatLactationsPath = (
  farmId: string | number,
  goatId: string | number
): string =>
  `${buildGoatDetailPath(farmId, goatId)}/lactations`;

export const buildGoatMilkProductionsPath = (
  farmId: string | number,
  goatId: string | number
): string =>
  `${buildGoatDetailPath(farmId, goatId)}/milk-productions`;

export const buildGoatReproductionPath = (
  farmId: string | number,
  goatId: string | number
): string =>
  `${buildGoatDetailPath(farmId, goatId)}/reproduction`;

export const buildGoatGenealogyPath = (
  farmId: string | number,
  goatId: string | number
): string =>
  `${buildPublicGoatDetailPath(farmId, goatId)}/genealogia`;

export const buildGoatEventsPath = (
  registrationNumber: string,
  farmId?: string | number | null
): string => {
  const base = `/cabras/${encodePathSegment(registrationNumber)}/eventos`;

  if (farmId == null || farmId === "") {
    return base;
  }

  return `${base}?farmId=${encodePathSegment(farmId)}`;
};

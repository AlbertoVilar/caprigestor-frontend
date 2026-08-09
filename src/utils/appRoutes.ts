const encodePathSegment = (value: string | number): string =>
  encodeURIComponent(String(value));

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

export const buildFarmDashboardPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/dashboard`;

export const buildFarmInventoryPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/inventory`;

export const buildFarmCommercialPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/commercial`;

export const buildFarmMilkConsolidatedPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/milk-consolidated`;

export const buildFarmAlertsPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/alerts`;

export const buildFarmHealthAgendaPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/health-agenda`;

export const buildFarmGoatsPath = (farmId: string | number): string =>
  `/cabras?farmId=${encodePathSegment(farmId)}`;

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

const encodePathSegment = (value: string | number): string =>
  encodeURIComponent(String(value));

export const buildFarmDashboardPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/dashboard`;

export const buildFarmInventoryPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/inventory`;

export const buildFarmAlertsPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/alerts`;

export const buildFarmHealthAgendaPath = (farmId: string | number): string =>
  `/app/goatfarms/${encodePathSegment(farmId)}/health-agenda`;

export const buildFarmGoatsPath = (farmId: string | number): string =>
  `/cabras?farmId=${encodePathSegment(farmId)}`;

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

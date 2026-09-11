export const normalizeRegistrationPart = (value: string): string =>
  value.trim().replace(/\s+/g, "").toUpperCase();

export const deriveRegistrationPreview = (tod: string, toe: string): string =>
  `${normalizeRegistrationPart(tod)}${normalizeRegistrationPart(toe)}`;


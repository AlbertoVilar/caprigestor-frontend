const DEFAULT_API_ORIGIN = "http://localhost:8080";
export const API_PREFIX = "/api/v1";
export const LEGACY_API_PREFIX = "/api"; // DEPRECATED: remove after 2026-06-30

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const stripKnownApiSuffix = (value: string): string =>
  value.replace(/\/api(?:\/v\d+)?$/i, "");

const normalizeBaseInput = (value?: string): string => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return DEFAULT_API_ORIGIN;
  }
  return trimTrailingSlash(trimmed);
};

const withApiPrefix = (base: string, prefix: string): string => {
  const normalizedBase = trimTrailingSlash(base);

  if (!normalizedBase || normalizedBase === "/") {
    return prefix;
  }

  if (normalizedBase.endsWith(prefix)) {
    return normalizedBase;
  }

  const withoutSuffix = stripKnownApiSuffix(normalizedBase);
  if (withoutSuffix !== normalizedBase) {
    return `${withoutSuffix}${prefix}`;
  }

  return `${normalizedBase}${prefix}`;
};

export const resolveApiBaseUrl = (
  baseUrl: string | undefined = import.meta.env.VITE_API_BASE_URL
): string => withApiPrefix(normalizeBaseInput(baseUrl), API_PREFIX);

export const resolveLegacyApiBaseUrl = (
  baseUrl: string | undefined = import.meta.env.VITE_API_BASE_URL
): string => withApiPrefix(normalizeBaseInput(baseUrl), LEGACY_API_PREFIX);

export const resolvePublicBaseUrl = (
  baseUrl: string | undefined = import.meta.env.VITE_API_BASE_URL
): string => stripKnownApiSuffix(normalizeBaseInput(baseUrl));

export const isDeprecatedApiFallbackEnabled = (): boolean =>
  import.meta.env.VITE_ENABLE_DEPRECATED_API_FALLBACK === "true";

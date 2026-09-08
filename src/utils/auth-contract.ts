/** Canonical client-side authentication contract shared by every HTTP caller. */
export const ACCESS_TOKEN_STORAGE_KEY = "authToken";
export const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";

const PUBLIC_AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/register-farm",
  "/auth/password-reset/request",
  "/auth/password-reset/confirm",
]);

function normalizePath(url: string): string {
  const raw = url.split("?")[0].replace(/\/$/, "");
  try {
    const parsed = new URL(raw, "http://caprigestor.local");
    return parsed.pathname
      .replace(/^\/api\/v1/, "")
      .replace(/\/$/, "") || "/";
  } catch {
    return raw.replace(/^\/api\/v1/, "") || "/";
  }
}

/**
 * Mirrors the backend SecurityConfig public read contract. Matching is path
 * based (never a loose substring match) so an unrelated URL cannot bypass the
 * auth header accidentally.
 */
export function isPublicEndpoint(url: string, method = "GET"): boolean {
  const path = normalizePath(url);
  const upperMethod = method.toUpperCase();

  if (PUBLIC_AUTH_PATHS.has(path)) return true;
  if (upperMethod !== "GET") return false;

  return (
    path === "/genealogies" ||
    path === "/goatfarms" ||
    path === "/goatfarms/name" ||
    /^\/goatfarms\/\d+$/.test(path) ||
    /^\/goatfarms\/\d+\/goats$/.test(path) ||
    /^\/goatfarms\/\d+\/goats\/(?!summary$)[^/]+$/.test(path) ||
    /^\/goatfarms\/\d+\/goats\/search$/.test(path) ||
    /^\/goatfarms\/\d+\/goats\/[^/]+\/offspring$/.test(path) ||
    /^\/goatfarms\/\d+\/goats\/[^/]+\/genealogies$/.test(path) ||
    /^\/goatfarms\/\d+\/goats\/imports\/abcc\/races$/.test(path)
  );
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function saveRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
}

export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function clearAuthenticationStorage(): void {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  clearRefreshToken();
  localStorage.removeItem("user");
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

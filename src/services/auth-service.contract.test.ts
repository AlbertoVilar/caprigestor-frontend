import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleEnum } from "../Models/auth";

const requestBackEnd = vi.hoisted(() => {
  return Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() });
});
const refreshAccessToken = vi.hoisted(() => vi.fn());

vi.mock("../utils/request", () => ({ requestBackEnd, refreshAccessToken }));

import {
  getAccessTokenPayload,
  getAuthHeaders,
  getCurrentUser,
  hasAnyRoles,
  hasRole,
  isAuthenticated,
  loginRequest,
  logOut,
  registerUser,
  refreshToken,
} from "./auth-service";

function jwtToken(claims: Record<string, unknown>): string {
  const encode = (value: string) => btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${encode('{"alg":"none","typ":"JWT"}')}.${encode(JSON.stringify(claims))}.signature`;
}

describe("auth service contract", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      get length() { return values.size; },
    } satisfies Storage;
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("sessionStorage", storage);
    vi.clearAllMocks();
  });

  it("persists the canonical access/refresh pair returned by login", async () => {
    requestBackEnd.post.mockResolvedValue({
      status: 200,
      data: { accessToken: "access-value", refreshToken: "refresh-value" },
    });

    await loginRequest({ email: "operator@example.invalid", password: "synthetic-password" });

    expect(requestBackEnd.post).toHaveBeenCalledWith("/auth/login", {
      email: "operator@example.invalid",
      password: "synthetic-password",
    }, expect.any(Object));
    expect(localStorage.getItem("authToken")).toBe("access-value");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-value");
  });

  it("uses the public registration contract and never sends roles or username", async () => {
    requestBackEnd.post.mockResolvedValue({
      status: 201,
      data: { id: 10, name: "Synthetic User", email: "user@example.invalid" },
    });

    await registerUser({
      name: "Synthetic User",
      email: "user@example.invalid",
      cpf: "12345678909",
      password: "synthetic-password",
      confirmPassword: "synthetic-password",
    });

    const payload = requestBackEnd.post.mock.calls[0][1];
    expect(requestBackEnd.post.mock.calls[0][0]).toBe("/auth/register");
    expect(payload).toEqual(expect.objectContaining({ name: "Synthetic User", email: "user@example.invalid" }));
    expect(payload).not.toHaveProperty("roles");
    expect(payload).not.toHaveProperty("username");
  });

  it("revokes the backend session before clearing local state", () => {
    localStorage.setItem("authToken", "access-value");
    localStorage.setItem("refreshToken", "refresh-value");

    logOut();

    expect(requestBackEnd.post).toHaveBeenCalledWith("/auth/logout", { refreshToken: "refresh-value" });
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("clears the session when a manual refresh fails", async () => {
    localStorage.setItem("authToken", "old-access");
    localStorage.setItem("refreshToken", "old-refresh");
    refreshAccessToken.mockRejectedValue(new Error("revoked"));

    await expect(refreshToken()).rejects.toThrow("Falha ao renovar token");
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("normalizes JWT claims and exposes the canonical current-user contract", () => {
    localStorage.setItem("authToken", jwtToken({
      sub: "operator@example.invalid",
      userName: "Operator",
      userId: "42",
      email: "operator@example.invalid",
      authorities: "ROLE_OPERATOR ROLE_FARM_OWNER",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));

    expect(getAccessTokenPayload()).toEqual(expect.objectContaining({
      user_name: "Operator",
      userName: "Operator",
      userId: 42,
      userEmail: "operator@example.invalid",
      authorities: ["ROLE_OPERATOR", "ROLE_FARM_OWNER"],
    }));
    expect(isAuthenticated()).toBe(true);
    expect(hasRole(RoleEnum.ROLE_OPERATOR)).toBe(true);
    expect(hasAnyRoles([RoleEnum.ROLE_ADMIN])).toBe(false);
    expect(hasAnyRoles([])).toBe(true);
    expect(getCurrentUser()).toEqual({
      id: 42,
      username: "Operator",
      email: "operator@example.invalid",
      roles: ["ROLE_OPERATOR", "ROLE_FARM_OWNER"],
    });
  });

  it("fails closed for missing, malformed and expired access tokens", () => {
    expect(getAccessTokenPayload()).toBeUndefined();
    expect(isAuthenticated()).toBe(false);
    localStorage.setItem("authToken", "not-a-jwt");
    expect(getAccessTokenPayload()).toBeUndefined();

    localStorage.setItem("authToken", jwtToken({ exp: Math.floor(Date.now() / 1000) - 1 }));
    expect(getAccessTokenPayload()).toBeDefined();
    expect(isAuthenticated()).toBe(false);
    expect(getCurrentUser()).not.toBeNull();
  });

  it("adds Authorization only to private endpoints", () => {
    localStorage.setItem("authToken", "access-value");
    expect(getAuthHeaders("/auth/login", "POST")).toEqual({});
    expect(getAuthHeaders("/api/v1/goatfarms/8", "GET")).toEqual({});
    expect(getAuthHeaders("/api/v1/goatfarms/8/management", "GET")).toEqual({ Authorization: "Bearer access-value" });
    expect(getAuthHeaders("/api/v1/goatfarms/8/goats/technical-99/registration-history", "GET")).toEqual({ Authorization: "Bearer access-value" });
    expect(getAuthHeaders("/api/v1/goatfarms/8/goats/technical-99/registration", "PATCH")).toEqual({ Authorization: "Bearer access-value" });
    expect(getAuthHeaders("/api/v1/goatfarms/8/alerts", "GET")).toEqual({ Authorization: "Bearer access-value" });
    expect(getAuthHeaders("/goatfarms/8", "POST")).toEqual({ Authorization: "Bearer access-value" });
  });

  it("keeps the session when manual refresh succeeds", async () => {
    localStorage.setItem("authToken", "old-access");
    localStorage.setItem("refreshToken", "old-refresh");
    refreshAccessToken.mockResolvedValue("new-access");

    await expect(refreshToken()).resolves.toBeUndefined();
    expect(localStorage.getItem("authToken")).toBe("old-access");
    expect(localStorage.getItem("refreshToken")).toBe("old-refresh");
  });
});

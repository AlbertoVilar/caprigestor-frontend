import { beforeEach, describe, expect, it, vi } from "vitest";

const requestBackEnd = vi.hoisted(() => {
  return Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() });
});
const refreshAccessToken = vi.hoisted(() => vi.fn());

vi.mock("../utils/request", () => ({ requestBackEnd, refreshAccessToken }));

import { loginRequest, logOut, registerUser, refreshToken } from "./auth-service";

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
});

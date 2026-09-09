import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => {
  const instance = Object.assign(vi.fn(), {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  });
  return {
    instance,
    refreshPost: vi.fn(),
    requestFulfilled: undefined as ((config: MockConfig) => MockConfig) | undefined,
    responseFulfilled: undefined as ((response: unknown) => unknown) | undefined,
    responseRejected: undefined as ((error: MockError) => Promise<unknown>) | undefined,
  };
});

type MockHeaders = Record<string, string> & { get?: (name: string) => string | undefined };
type MockConfig = { url?: string; method?: string; headers?: MockHeaders; _retry?: boolean };
type MockError = { response?: { status?: number }; config?: MockConfig };

vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  axiosMock.instance.interceptors.request.use.mockImplementation((fulfilled: (config: MockConfig) => MockConfig) => {
    axiosMock.requestFulfilled = fulfilled;
  });
  axiosMock.instance.interceptors.response.use.mockImplementation((fulfilled: (response: unknown) => unknown, rejected: (error: MockError) => Promise<unknown>) => {
    axiosMock.responseFulfilled = fulfilled;
    axiosMock.responseRejected = rejected;
  });
  const axiosDefault = Object.assign(vi.fn(), {
    create: vi.fn(() => axiosMock.instance),
    post: axiosMock.refreshPost,
  });
  return { ...actual, default: axiosDefault };
});

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    isActive: vi.fn(() => false),
  },
}));

import {
  del,
  get,
  makeRequest,
  patch,
  post,
  put,
  refreshAccessToken,
} from "./request";

function installStorage() {
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
}

describe("request authentication contract", () => {
  beforeEach(() => {
    installStorage();
    vi.clearAllMocks();
    axiosMock.instance.mockReset();
  });

  it("rotates and persists the complete access/refresh pair", async () => {
    localStorage.setItem("refreshToken", "refresh-old");
    axiosMock.refreshPost.mockResolvedValue({ data: { accessToken: "access-new", refreshToken: "refresh-new" } });

    await expect(refreshAccessToken()).resolves.toBe("access-new");
    expect(axiosMock.refreshPost).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/refresh"),
      { refreshToken: "refresh-old" },
      expect.objectContaining({ timeout: 15000 }),
    );
    expect(localStorage.getItem("authToken")).toBe("access-new");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-new");
  });

  it("rejects refresh when the token or either rotated credential is missing", async () => {
    await expect(refreshAccessToken()).rejects.toThrow("No refresh token available");

    localStorage.setItem("refreshToken", "refresh-old");
    axiosMock.refreshPost.mockResolvedValue({ data: { refreshToken: "refresh-new" } });
    await expect(refreshAccessToken()).rejects.toThrow("No access token in refresh response");

    axiosMock.refreshPost.mockResolvedValue({ data: { accessToken: "access-new" } });
    await expect(refreshAccessToken()).rejects.toThrow("No refresh token in refresh response");
  });

  it("adds the current access token only to private requests", () => {
    expect(axiosMock.requestFulfilled).toBeDefined();
    localStorage.setItem("authToken", "access-value");

    const publicConfig = axiosMock.requestFulfilled!({ url: "/auth/login", method: "post", headers: {} });
    expect(publicConfig.headers).not.toHaveProperty("Authorization");

    const privateConfig = axiosMock.requestFulfilled!({ url: "/goatfarms/8/alerts", method: "get", headers: {} });
    expect(privateConfig.headers?.get?.("Authorization")).toBe("Bearer access-value");
  });

  it("refreshes one unauthorized request and retries it with a rotated session", async () => {
    localStorage.setItem("refreshToken", "refresh-old");
    axiosMock.refreshPost.mockResolvedValue({ data: { accessToken: "access-new", refreshToken: "refresh-new" } });
    axiosMock.instance.mockResolvedValue({ data: { ok: true } });

    const originalRequest: { url: string; method: string; headers: Record<string, string>; _retry?: boolean } = {
      url: "/goatfarms/8/alerts",
      method: "get",
      headers: {},
    };
    const result = await axiosMock.responseRejected!({ response: { status: 401 }, config: originalRequest });

    expect(result).toEqual({ data: { ok: true } });
    expect(originalRequest._retry).toBe(true);
    expect(axiosMock.instance).toHaveBeenCalledWith(originalRequest);
    expect(localStorage.getItem("authToken")).toBe("access-new");
  });

  it("clears storage and rejects when refresh fails", async () => {
    localStorage.setItem("authToken", "access-old");
    localStorage.setItem("refreshToken", "refresh-old");
    axiosMock.refreshPost.mockRejectedValue(new Error("revoked"));

    await expect(axiosMock.responseRejected!({ response: { status: 401 }, config: { url: "/private", method: "get" } }))
      .rejects.toThrow("revoked");
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });

  it("maps the convenience HTTP methods to the shared client", async () => {
    axiosMock.instance.mockResolvedValue({ data: { ok: true } });
    await expect(makeRequest({ method: "GET", url: "/one" })).resolves.toEqual({ ok: true });
    await expect(get("/two")).resolves.toEqual({ ok: true });
    await expect(post("/three", { value: 3 })).resolves.toEqual({ ok: true });
    await expect(put("/four", { value: 4 })).resolves.toEqual({ ok: true });
    await expect(del("/five")).resolves.toEqual({ ok: true });
    await expect(patch("/six", { value: 6 })).resolves.toEqual({ ok: true });
    expect(axiosMock.instance).toHaveBeenCalledTimes(6);
  });
});

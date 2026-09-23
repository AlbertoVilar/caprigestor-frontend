// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessTokenPayloadDTO } from "../Models/auth";
import { AuthProvider, useAuth } from "./AuthContext";

const mocks = vi.hoisted(() => ({
  getAccessTokenPayload: vi.fn(),
  saveAccessToken: vi.fn(),
  logOut: vi.fn(),
}));

vi.mock("../services/auth-service", () => ({
  getAccessTokenPayload: mocks.getAccessTokenPayload,
  saveAccessToken: mocks.saveAccessToken,
  logOut: mocks.logOut,
}));

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

type AuthState = ReturnType<typeof useAuth>;

function Probe({ onValue }: { onValue: (value: AuthState) => void }) {
  onValue(useAuth());
  return null;
}

async function mountProbe(onValue: (value: AuthState) => void) {
  const root = createRoot(document.createElement("div"));
  await act(async () => {
    root.render(
      <AuthProvider>
        <Probe onValue={onValue} />
      </AuthProvider>
    );
  });
  return root;
}

async function unmount(root: Root) {
  await act(async () => root.unmount());
}

function payload(exp: number): AccessTokenPayloadDTO {
  return { user_name: "alberto", authorities: ["ROLE_ADMIN"], exp, userId: 1 };
}

describe("AuthContext expiry contract", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.getAccessTokenPayload.mockReset();
    mocks.saveAccessToken.mockReset();
    mocks.logOut.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes from storage, reacts to storage updates, and expires on the scheduled timer", async () => {
    const initial = payload(Math.floor(Date.now() / 1000) + 1);
    const updated = payload(Math.floor(Date.now() / 1000) + 100);
    mocks.getAccessTokenPayload.mockReturnValue(initial);
    let latest!: AuthState;
    const root = await mountProbe((value) => { latest = value; });

    expect(latest.tokenPayload).toEqual(initial);
    expect(latest.isAuthenticated).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });
    expect(latest.tokenPayload).toBeUndefined();

    mocks.getAccessTokenPayload.mockReturnValue(updated);
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage"));
    });
    expect(latest.tokenPayload).toEqual(updated);
    expect(latest.isAuthenticated).toBe(true);
    await unmount(root);
  });

  it("preserves login/logout behavior and cleans up expiry timers", async () => {
    const stored = payload(Math.floor(Date.now() / 1000) + 100);
    mocks.getAccessTokenPayload.mockReturnValue(stored);
    let latest!: AuthState;
    const root = await mountProbe((value) => { latest = value; });
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    await act(async () => {
      latest.login("token-1");
    });
    expect(mocks.saveAccessToken).toHaveBeenCalledWith("token-1");
    expect(latest.tokenPayload).toEqual(stored);

    await act(async () => {
      latest.logout();
    });
    expect(mocks.logOut).toHaveBeenCalledTimes(1);
    expect(latest.tokenPayload).toBeUndefined();

    await unmount(root);
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

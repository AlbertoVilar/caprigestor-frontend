// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFarmPermissions } from "../api/GoatFarmAPI/goatFarm";
import { useFarmPermissions } from "./useFarmPermissions";

vi.mock("../api/GoatFarmAPI/goatFarm", () => ({
  getFarmPermissions: vi.fn(),
}));

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

const getFarmPermissionsMock = vi.mocked(getFarmPermissions);
type FarmPermissions = ReturnType<typeof useFarmPermissions>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function Probe({ farmId, onValue }: { farmId?: number; onValue: (value: FarmPermissions) => void }) {
  onValue(useFarmPermissions(farmId));
  return null;
}

async function mountProbe(farmId: number | undefined, onValue: (value: FarmPermissions) => void) {
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () => {
    root.render(<Probe farmId={farmId} onValue={onValue} />);
  });
  return { root, container };
}

async function renderProbe(root: Root, farmId: number | undefined, onValue: (value: FarmPermissions) => void) {
  await act(async () => {
    root.render(<Probe farmId={farmId} onValue={onValue} />);
  });
}

async function unmount(root: Root) {
  await act(async () => root.unmount());
}

describe("useFarmPermissions", () => {
  beforeEach(() => {
    getFarmPermissionsMock.mockReset();
  });

  it("fails closed without a farm id and does not call the backend", async () => {
    let latest!: FarmPermissions;
    const mounted = await mountProbe(undefined, (value) => { latest = value; });

    expect(latest).toMatchObject({
      canOperateFarm: false,
      canAdministerFarm: false,
      canCreateGoat: false,
      loading: false,
    });
    expect(getFarmPermissionsMock).not.toHaveBeenCalled();
    await unmount(mounted.root);
  });

  it("exposes backend capabilities and compatibility aliases only after loading", async () => {
    const pending = deferred<{ canOperateFarm: boolean; canAdministerFarm: boolean }>();
    getFarmPermissionsMock.mockReturnValueOnce(pending.promise);
    let latest!: FarmPermissions;
    const mounted = await mountProbe(7, (value) => { latest = value; });

    expect(latest.loading).toBe(true);
    expect(latest.canOperateFarm).toBe(false);
    expect(latest.canCreateGoat).toBe(false);

    await act(async () => pending.resolve({ canOperateFarm: true, canAdministerFarm: false }));
    expect(latest).toMatchObject({
      loading: false,
      canOperateFarm: true,
      canAdministerFarm: false,
      canCreateGoat: true,
      canManageLactation: true,
      canManageMilkProduction: true,
      canManageReproduction: true,
    });
    await unmount(mounted.root);
  });

  it("fails closed when the capability request errors", async () => {
    const pending = deferred<{ canOperateFarm: boolean; canAdministerFarm: boolean }>();
    getFarmPermissionsMock.mockReturnValueOnce(pending.promise);
    let latest!: FarmPermissions;
    const mounted = await mountProbe(8, (value) => { latest = value; });

    await act(async () => pending.reject(new Error("network")));
    expect(latest).toMatchObject({
      loading: false,
      canOperateFarm: false,
      canAdministerFarm: false,
      canCreateGoat: false,
    });
    await unmount(mounted.root);
  });

  it("clears old capabilities immediately when the farm changes", async () => {
    const first = deferred<{ canOperateFarm: boolean; canAdministerFarm: boolean }>();
    const second = deferred<{ canOperateFarm: boolean; canAdministerFarm: boolean }>();
    getFarmPermissionsMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    let latest!: FarmPermissions;
    const mounted = await mountProbe(1, (value) => { latest = value; });

    await renderProbe(mounted.root, 2, (value) => { latest = value; });
    expect(latest).toMatchObject({ loading: true, canOperateFarm: false, canAdministerFarm: false });

    await act(async () => first.resolve({ canOperateFarm: true, canAdministerFarm: true }));
    expect(latest).toMatchObject({ loading: true, canOperateFarm: false, canAdministerFarm: false });

    await act(async () => second.resolve({ canOperateFarm: false, canAdministerFarm: true }));
    expect(latest).toMatchObject({ loading: false, canOperateFarm: false, canAdministerFarm: true });
    await unmount(mounted.root);
  });

  it("resets state when the farm context is removed", async () => {
    const pending = deferred<{ canOperateFarm: boolean; canAdministerFarm: boolean }>();
    getFarmPermissionsMock.mockReturnValueOnce(pending.promise);
    let latest!: FarmPermissions;
    const mounted = await mountProbe(3, (value) => { latest = value; });

    await renderProbe(mounted.root, undefined, (value) => { latest = value; });
    expect(latest).toMatchObject({ loading: false, canOperateFarm: false, canAdministerFarm: false });
    await act(async () => pending.resolve({ canOperateFarm: true, canAdministerFarm: true }));
    expect(latest.canOperateFarm).toBe(false);
    await unmount(mounted.root);
  });
});

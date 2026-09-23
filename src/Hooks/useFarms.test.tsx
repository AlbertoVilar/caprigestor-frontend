// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFarms } from "./useFarms";

const mocks = vi.hoisted(() => ({
  getFarms: vi.fn(),
  farmService: undefined as { getFarms: typeof vi.fn } | undefined,
}));

mocks.farmService = { getFarms: mocks.getFarms };

vi.mock("../contexts/ApiContext", () => ({
  useApi: () => ({ farmService: mocks.farmService }),
}));

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

type FarmsState = ReturnType<typeof useFarms>;

function Probe({ onValue }: { onValue: (value: FarmsState) => void }) {
  onValue(useFarms());
  return null;
}

async function mountProbe(onValue: (value: FarmsState) => void) {
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () => {
    root.render(<Probe onValue={onValue} />);
  });
  return { root, container };
}

async function unmount(root: Root) {
  await act(async () => root.unmount());
}

describe("useFarms async pagination contract", () => {
  beforeEach(() => {
    mocks.getFarms.mockReset();
    mocks.getFarms.mockResolvedValue({ content: [], totalPages: 3, totalElements: 3 });
  });

  it("auto-loads once and search resets to page zero without a duplicate request", async () => {
    let latest!: FarmsState;
    const mounted = await mountProbe((value) => { latest = value; });

    expect(mocks.getFarms).toHaveBeenCalledTimes(1);
    expect(mocks.getFarms).toHaveBeenLastCalledWith(0, 10, undefined);

    await act(async () => {
      await latest.searchFarms("bocaina");
    });

    expect(latest.currentPage).toBe(0);
    expect(mocks.getFarms).toHaveBeenCalledTimes(2);
    expect(mocks.getFarms).toHaveBeenLastCalledWith(0, 10, "bocaina");
    await unmount(mounted.root);
  });

  it("loads the selected page and refreshes the current query/page", async () => {
    let latest!: FarmsState;
    const mounted = await mountProbe((value) => { latest = value; });

    await act(async () => {
      await latest.goToPage(1);
    });
    expect(latest.currentPage).toBe(1);
    expect(mocks.getFarms).toHaveBeenLastCalledWith(1, 10, undefined);

    const requestCountBeforeRefresh = mocks.getFarms.mock.calls.length;
    await act(async () => {
      await latest.refresh();
    });
    expect(mocks.getFarms).toHaveBeenCalledTimes(requestCountBeforeRefresh + 1);
    expect(mocks.getFarms).toHaveBeenLastCalledWith(1, 10, undefined);
    expect(latest.hasPreviousPage).toBe(true);
    expect(latest.hasNextPage).toBe(true);
    await unmount(mounted.root);
  });
});

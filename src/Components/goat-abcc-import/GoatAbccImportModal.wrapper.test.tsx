// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoatAbccImportModal from "./GoatAbccImportModal";

const mocks = vi.hoisted(() => ({
  listAbccRaceOptions: vi.fn(),
}));

vi.mock("../../Hooks/usePermissions", () => ({
  usePermissions: () => ({ isAdmin: () => false }),
}));

vi.mock("../../api/GoatAPI/goatAbccImport", () => ({
  confirmGoatImportBatchFromAbcc: vi.fn(),
  confirmGoatImportFromAbcc: vi.fn(),
  lookupGoatByAbccRegistration: vi.fn(),
  listAbccRaceOptions: mocks.listAbccRaceOptions,
  previewGoatFromAbcc: vi.fn(),
  searchGoatsByAbcc: vi.fn(),
}));

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

async function renderModal(root: Root, isOpen: boolean, defaultTod = "TOD-19") {
  await act(async () => {
    root.render(
      <GoatAbccImportModal
        isOpen={isOpen}
        farmId={19}
        defaultTod={defaultTod}
        onClose={vi.fn()}
        onImported={vi.fn()}
      />
    );
  });
}

describe("GoatAbccImportModal open effect", () => {
  let root: Root;

  beforeEach(() => {
    mocks.listAbccRaceOptions.mockReset();
    mocks.listAbccRaceOptions.mockResolvedValue({ items: [] });
    root = createRoot(document.createElement("div"));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
  });

  it("loads races once while open and repeats the reset/load sequence only on reopen", async () => {
    await renderModal(root, true);
    expect(mocks.listAbccRaceOptions).toHaveBeenCalledTimes(1);

    await renderModal(root, true);
    expect(mocks.listAbccRaceOptions).toHaveBeenCalledTimes(1);

    await renderModal(root, false);
    await renderModal(root, true);
    expect(mocks.listAbccRaceOptions).toHaveBeenCalledTimes(2);
  });

  it("restarts deterministically when the non-admin farm TOD context changes", async () => {
    await renderModal(root, true, "TOD-19");
    await renderModal(root, true, "TOD-20");
    expect(mocks.listAbccRaceOptions).toHaveBeenCalledTimes(2);
  });
});

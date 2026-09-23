// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoatEventList from "./GoatEventList";

const mocks = vi.hoisted(() => ({
  getGoatEvents: vi.fn(),
  deleteEvent: vi.fn(),
  confirmAlert: vi.fn(),
  latestEditCallback: undefined as (() => void) | undefined,
}));

vi.mock("../../api/EventsAPI/event", () => ({
  getGoatEvents: mocks.getGoatEvents,
  deleteEvent: mocks.deleteEvent,
}));

vi.mock("./event-datails/ModalEventDetails", () => ({
  default: () => null,
}));

vi.mock("./ModalEventEdit", () => ({
  default: (props: { onEventUpdated: () => void }) => {
    mocks.latestEditCallback = props.onEventUpdated;
    return null;
  },
}));

vi.mock("react-confirm-alert", () => ({
  confirmAlert: mocks.confirmAlert,
}));

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

const event = {
  id: 7,
  goatId: "1400800001",
  date: "2026-09-20",
  eventType: "HEALTH",
  description: "Vacinação",
  location: "Bocaina",
  veterinarian: "Dra. Ana",
  outcome: "Realizado",
};

async function renderList(
  root: Root,
  filters?: { type?: string; startDate?: string; endDate?: string }
) {
  await act(async () => {
    root.render(
      <GoatEventList registrationNumber="1400800001" farmId={19} filters={filters} />
    );
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("GoatEventList loader contract", () => {
  let root: Root;

  beforeEach(() => {
    mocks.getGoatEvents.mockReset();
    mocks.getGoatEvents.mockResolvedValue([event]);
    mocks.deleteEvent.mockReset().mockResolvedValue(undefined);
    mocks.confirmAlert.mockReset();
    mocks.latestEditCallback = undefined;
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.innerHTML = "";
  });

  it("fetches initially, ignores equivalent filter object identities, and refetches changed filters", async () => {
    await renderList(root, { type: "HEALTH" });
    expect(mocks.getGoatEvents).toHaveBeenCalledTimes(1);

    await renderList(root, { type: "HEALTH" });
    expect(mocks.getGoatEvents).toHaveBeenCalledTimes(1);

    await renderList(root, { type: "REPRODUCTION" });
    expect(mocks.getGoatEvents).toHaveBeenCalledTimes(2);
    expect(mocks.getGoatEvents).toHaveBeenLastCalledWith(
      19,
      "1400800001",
      { type: "REPRODUCTION", startDate: undefined, endDate: undefined }
    );
  });

  it("reuses the stable loader after a successful edit refresh", async () => {
    await renderList(root);
    expect(mocks.getGoatEvents).toHaveBeenCalledTimes(1);

    const editIcon = document.querySelector(".icon-edit");
    expect(editIcon).not.toBeNull();
    await act(async () => {
      editIcon?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(mocks.latestEditCallback).toBeTypeOf("function");

    await act(async () => {
      mocks.latestEditCallback?.();
    });
    expect(mocks.getGoatEvents).toHaveBeenCalledTimes(2);
  });

  it("reuses the stable loader after a successful delete refresh", async () => {
    await renderList(root);
    const deleteIcon = document.querySelector(".icon-delete");
    expect(deleteIcon).not.toBeNull();

    await act(async () => {
      deleteIcon?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(mocks.confirmAlert).toHaveBeenCalledTimes(1);
    const confirmation = mocks.confirmAlert.mock.calls[0][0] as {
      buttons: Array<{ onClick: () => void }>;
    };

    await act(async () => {
      confirmation.buttons[0].onClick();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.deleteEvent).toHaveBeenCalledWith(19, "1400800001", 7);
    expect(mocks.getGoatEvents).toHaveBeenCalledTimes(2);
  });
});

// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import ModalEventEdit from "./ModalEventEdit";

const mocks = vi.hoisted(() => ({ updateEvent: vi.fn() }));
vi.mock("../../api/EventsAPI/event", () => ({ updateEvent: mocks.updateEvent }));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

const baseEvent = {
  id: 7,
  goatId: "1400800001",
  goatName: "Matriz",
  date: "2026-09-20",
  description: "Registro de manejo",
  location: "Bocaina",
  veterinarian: "",
  outcome: "Observação",
};

describe("ModalEventEdit generic write boundary", () => {
  let root: Root | undefined;

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount());
      root = undefined;
    }
    document.body.innerHTML = "";
    mocks.updateEvent.mockReset().mockResolvedValue(undefined);
  });

  async function render(eventType: string) {
    mocks.updateEvent.mockResolvedValue(undefined);
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root?.render(
        <ModalEventEdit
          event={{ ...baseEvent, eventType }}
          farmId={19}
          onClose={vi.fn()}
          onEventUpdated={vi.fn()}
        />
      );
    });
    return container;
  }

  it.each(["PESAGEM", "OUTRO"])("keeps %s editable", async (eventType) => {
    const container = await render(eventType);
    const options = Array.from(container.querySelectorAll("select[name='eventType'] option"))
      .map((option) => (option as HTMLOptionElement).value);
    expect(options).toEqual(["PESAGEM", "OUTRO"]);

    await act(async () => {
      container.querySelector("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });
    expect(mocks.updateEvent).toHaveBeenCalledWith(19, "1400800001", 7, expect.objectContaining({ eventType }));
  });

  it("renders legacy event as read-only without a save form", async () => {
    const container = await render("VACINACAO");
    expect(container.textContent).toContain("Evento histórico somente leitura");
    expect(container.querySelector("form")).toBeNull();
    expect(mocks.updateEvent).not.toHaveBeenCalled();
  });
});

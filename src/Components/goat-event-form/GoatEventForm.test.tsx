// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import GoatEventForm from "./GoatEventForm";

vi.mock("../../api/EventsAPI/event", () => ({
  createGoatEvent: vi.fn(),
}));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

describe("GoatEventForm generic event choices", () => {
  let root: Root | undefined;

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount());
      root = undefined;
    }
    document.body.innerHTML = "";
  });

  it("offers only PESAGEM and OUTRO for generic event creation", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<GoatEventForm goatId="1400800001" farmId={19} />);
    });

    const options = Array.from(container.querySelectorAll("select[name='eventType'] option"))
      .map((option) => (option as HTMLOptionElement).value)
      .filter(Boolean);
    expect(options).toEqual(["PESAGEM", "OUTRO"]);
  });
});

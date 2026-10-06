// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import FarmAnimalViewSwitcher from "./FarmAnimalViewSwitcher";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("FarmAnimalViewSwitcher", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("links the current herd and historical registry without merging their contexts", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/cabras?farmId=19"]}>
          <FarmAnimalViewSwitcher farmId={19} />
        </MemoryRouter>
      );
    });

    const links = [...container.querySelectorAll<HTMLAnchorElement>("a")];
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toBe("/cabras?farmId=19");
    expect(links[0].getAttribute("aria-current")).toBe("page");
    expect(links[1].getAttribute("href")).toBe("/app/goatfarms/19/registry");
    expect(container.textContent).toContain("Inclui animais vendidos, transferidos e históricos");
  });

  it("marks the registry as the active page when opened", async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/app/goatfarms/19/registry"]}>
          <FarmAnimalViewSwitcher farmId={19} />
        </MemoryRouter>
      );
    });

    const activeLink = container.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
    expect(activeLink?.textContent).toContain("Registro da fazenda");
  });
});

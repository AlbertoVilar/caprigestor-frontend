import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Home from "./Home";

vi.mock("../../api/GoatFarmAPI/goatFarm", () => ({
  getAllFarms: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../Components/home/FarmsCarousel", () => ({
  default: () => <div>FarmsCarousel</div>,
}));

vi.mock("../../Components/home/BlogSection", () => ({
  default: () => <div>BlogSection</div>,
}));

describe("Home", () => {
  it("keeps the secondary CTA pointing to the about page", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(html).toContain('href="/sobre"');
  });
});

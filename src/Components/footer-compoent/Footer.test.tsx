import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Footer from "./Footer";

describe("Footer", () => {
  it("does not expose a false global genealogy destination", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(html).not.toContain('href="/genealogia"');
    expect(html).toContain('href="/sobre"');
    expect(html).toContain("Sobre o CapriGestor");
  });
});

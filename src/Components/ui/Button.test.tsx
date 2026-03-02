import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders variant and size classes", () => {
    const html = renderToStaticMarkup(
      <Button variant="secondary" size="lg">
        Salvar
      </Button>
    );

    expect(html).toContain("gf-button--secondary");
    expect(html).toContain("gf-button--lg");
    expect(html).toContain(">Salvar<");
  });

  it("marks loading buttons as busy", () => {
    const html = renderToStaticMarkup(
      <Button loading>Processando</Button>
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("gf-button--loading");
  });
});

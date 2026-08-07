import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import FarmLogoImage, { DEFAULT_FARM_IMAGE } from "./FarmLogoImage";

describe("FarmLogoImage", () => {
  it("usa a imagem padrão quando a fazenda não possui logo", () => {
    const html = renderToStaticMarkup(
      <FarmLogoImage farmName="Capril Vilar" className="farm-logo" />,
    );

    expect(html).toContain(`src="${DEFAULT_FARM_IMAGE}"`);
    expect(html).toContain("Imagem padrão da fazenda Capril Vilar");
    expect(html).toContain('data-fallback="true"');
  });

  it("preserva a logo cadastrada e sua descrição acessível", () => {
    const html = renderToStaticMarkup(
      <FarmLogoImage farmName="Capril Alto Paraíso" src="https://cdn.example.com/logo.png" />,
    );

    expect(html).toContain('src="https://cdn.example.com/logo.png"');
    expect(html).toContain("Logo da fazenda Capril Alto Paraíso");
    expect(html).toContain('data-fallback="false"');
  });
});

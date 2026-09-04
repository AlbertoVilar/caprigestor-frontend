import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import FarmLogoImage from "./FarmLogoImage";
import {
  CAPRIL_ALTO_PARAISO_LOGO,
  CAPRIL_VILAR_LOGO,
  DEFAULT_FARM_IMAGE,
  resolveFarmLogoSource,
} from "./farmLogoSources";

describe("FarmLogoImage", () => {
  it("usa a imagem padrão quando a fazenda não possui logo", () => {
    const html = renderToStaticMarkup(
      <FarmLogoImage farmName="Fazenda sem logo" className="farm-logo" />,
    );

    expect(html).toContain(`src="${DEFAULT_FARM_IMAGE}"`);
    expect(html).toContain("Imagem padrão da fazenda Fazenda sem logo");
    expect(html).toContain('data-fallback="true"');
  });

  it("recupera localmente as duas logos cujas URLs legadas não existem mais", () => {
    expect(resolveFarmLogoSource(
      "https://raw.githubusercontent.com/AlbertoVilar/Imagens-Capris/main/590269883_836883355746160_72604593097600571_n.jpg",
      "Capril Vilar",
    )).toBe(CAPRIL_VILAR_LOGO);
    expect(resolveFarmLogoSource(
      "https://raw.githubusercontent.com/AlbertoVilar/Imagens-Capris/main/capril_alto_paraiso_n.jpg",
      "Capril Alto Paraíso",
    )).toBe(CAPRIL_ALTO_PARAISO_LOGO);
  });

  it("usa a logo local conhecida quando o cadastro ainda não possui URL", () => {
    expect(resolveFarmLogoSource(null, " Capril Alto Paraíso ")).toBe(CAPRIL_ALTO_PARAISO_LOGO);
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

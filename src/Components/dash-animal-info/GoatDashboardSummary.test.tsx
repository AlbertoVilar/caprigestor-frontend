import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GoatDashboardSummary from "./GoatDashboardSummary";

describe("GoatDashboardSummary", () => {
  it("renders the herd totals and breed breakdown from the real summary", () => {
    const html = renderToStaticMarkup(
      <GoatDashboardSummary
        summary={{
          total: 128,
          males: 19,
          females: 109,
          active: 117,
          inactive: 4,
          sold: 5,
          deceased: 2,
          breeds: [
            { breed: "Saanen", count: 48 },
            { breed: "Boer", count: 32 },
            { breed: "Parda Alpina", count: 18 },
          ],
        }}
        visibleCount={12}
      />
    );

    expect(html).toContain("128 animais no rebanho");
    expect(html).toContain("12 animais exibidos nesta tela");
    expect(html).toContain("Distribuição por sexo");
    expect(html).toContain("Situação do rebanho");
    expect(html).toContain("Raças cadastradas");
    expect(html).toContain("Saanen");
  });

  it("keeps a compact retry state when the summary fails", () => {
    const html = renderToStaticMarkup(
      <GoatDashboardSummary
        summary={null}
        visibleCount={0}
        error="Falha ao carregar o resumo."
        onRetry={() => undefined}
      />
    );

    expect(html).toContain("Não foi possível carregar os indicadores da fazenda.");
    expect(html).toContain("Falha ao carregar o resumo.");
    expect(html).toContain(">Tentar novamente<");
  });
});

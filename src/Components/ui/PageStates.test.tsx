import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

describe("Page states", () => {
  it("renders an empty state with optional action", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        title="Sem itens"
        description="Cadastre o primeiro item."
        actionLabel="Cadastrar"
        onAction={vi.fn()}
      />
    );

    expect(html).toContain("Sem itens");
    expect(html).toContain("Cadastre o primeiro item.");
    expect(html).toContain(">Cadastrar<");
  });

  it("renders an error state with retry action", () => {
    const html = renderToStaticMarkup(
      <ErrorState
        title="Falha ao carregar"
        description="Tente novamente."
        onRetry={vi.fn()}
      />
    );

    expect(html).toContain("Falha ao carregar");
    expect(html).toContain("Tente novamente.");
    expect(html).toContain(">Tentar novamente<");
  });

  it("renders loading state label", () => {
    const html = renderToStaticMarkup(
      <LoadingState label="Carregando fazendas..." />
    );

    expect(html).toContain("Carregando fazendas...");
    expect(html).toContain("gf-loading-state");
  });
});

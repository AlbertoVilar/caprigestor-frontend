import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import FarmOperationalAgendaPanel from "./components/FarmOperationalAgendaPanel";
import { FarmOperationalAgendaItem, FarmOperationalAgendaSummary } from "./farmOperationalAgenda";

const summary: FarmOperationalAgendaSummary = {
  totalAttention: 5,
  counts: {
    health: 2,
    reproduction: 2,
    lactation: 1
  },
  items: []
};

const items: FarmOperationalAgendaItem[] = [
  {
    id: "health-1",
    source: "health",
    sourceLabel: "Sanidade",
    title: "Vacinação",
    description: "Evento sanitário previsto para hoje · Cabra MATRIZ-01",
    goatId: "MATRIZ-01",
    date: "2026-03-11",
    href: "/health/1",
    overdue: false
  },
  {
    id: "reproduction-1",
    source: "reproduction",
    sourceLabel: "Reprodução",
    title: "Diagnóstico de prenhez pendente",
    description: "Cabra MATRIZ-02 · última cobertura em 01/03/2026",
    goatId: "MATRIZ-02",
    date: "2026-03-12",
    href: "/reproduction/2",
    overdue: true,
    overdueDays: 1
  }
];

describe("FarmOperationalAgendaPanel", () => {
  it("renderiza a visão resumida da agenda operacional", () => {
    const markup = renderToStaticMarkup(
      <FarmOperationalAgendaPanel
        loading={false}
        warningMessage="Parte da agenda operacional não pôde ser carregada agora."
        summary={summary}
        activeFilter="all"
        items={items}
        onFilterChange={vi.fn()}
        onOpenItem={vi.fn()}
        onOpenAlerts={vi.fn()}
      />
    );

    expect(markup).toContain("O que precisa da sua atenção");
    expect(markup).toContain("Total em atenção");
    expect(markup).toContain("Parte da agenda operacional não pôde ser carregada agora.");
    expect(markup).toContain("Vacinação");
    expect(markup).toContain("Diagnóstico de prenhez pendente");
    expect(markup).toContain("Cabra MATRIZ-02");
  });
});

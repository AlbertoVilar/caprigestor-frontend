import { describe, expect, it } from "vitest";
import { buildCsv, buildOverviewRows, getReportFilename } from "./farmReports";

describe("farmReports helpers", () => {
  it("escapa CSV e preserva cabeçalhos", () => {
    const csv = buildCsv([
      { modulo: "Sanidade", detalhe: "Evento; com delimitador", observacao: "Texto \"com aspas\"" }
    ]);

    expect(csv).toContain("modulo;detalhe;observacao");
    expect(csv).toContain('"Evento; com delimitador"');
    expect(csv).toContain('"Texto ""com aspas"""');
  });

  it("monta linhas de visão geral e nome de arquivo previsível", () => {
    const rows = buildOverviewRows({
      herdSummary: { total: 12, males: 2, females: 10, active: 11, inactive: 1, sold: 0, deceased: 0, breeds: [] },
      healthAlerts: { dueTodayCount: 1, upcomingCount: 2, overdueCount: 3, dueTodayTop: [], upcomingTop: [], overdueTop: [] },
      pregnancyAlerts: { totalPending: 4, alerts: [] },
      dryOffAlerts: { totalPending: 2, alerts: [] },
      inventoryBalances: []
    });

    expect(rows).toContainEqual({ indicador: "Total do rebanho", valor: 12 });
    expect(rows).toContainEqual({ indicador: "Diagnósticos reprodutivos pendentes", valor: 4 });
    expect(getReportFilename("overview", "Capril Vilar")).toBe("caprigestor-capril-vilar-overview.csv");
  });
});

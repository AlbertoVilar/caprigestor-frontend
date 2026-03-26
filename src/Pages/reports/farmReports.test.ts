import { describe, expect, it } from "vitest";
import {
  buildCsv,
  buildOverviewRows,
  buildReproductionRows,
  getReportFilename,
} from "./farmReports";

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

  it("traduz marcos do ciclo reprodutivo e inclui a saída do animal", () => {
    const rows = buildReproductionRows({
      events: [
        {
          id: 1,
          farmId: 7,
          goatId: "MATRIZ-01",
          eventType: "WEANING",
          eventDate: "2026-03-25",
          notes: "Desmame manual",
        },
      ],
      pregnancies: [
        {
          id: 9,
          farmId: 7,
          goatId: "MATRIZ-01",
          status: "CLOSED",
          closeDate: "2026-03-20",
          closeReason: "BIRTH",
        },
      ],
      goat: {
        registrationNumber: "MATRIZ-01",
        name: "Cabra teste",
        breed: "SAANEN",
        color: "Branca",
        gender: "FEMEA",
        birthDate: "2024-01-01",
        status: "VENDIDO",
        category: "PO",
        toe: "001",
        tod: "16432",
        farmId: 7,
        exitType: "VENDA",
        exitDate: "2026-03-26",
        exitNotes: "Venda concluida",
      },
    });

    expect(rows).toContainEqual({
      secao: "Evento reprodutivo",
      data: "25/03/2026",
      tipo: "Desmame",
      detalhe: "-",
      observacoes: "Desmame manual",
    });
    expect(rows).toContainEqual({
      secao: "Gestação",
      data: "20/03/2026",
      tipo: "Encerrada",
      detalhe: "Parto",
      observacoes: "-",
    });
    expect(rows).toContainEqual({
      secao: "Saída do rebanho",
      data: "26/03/2026",
      tipo: "Venda",
      detalhe: "VENDIDO",
      observacoes: "Venda concluida",
    });
  });
});
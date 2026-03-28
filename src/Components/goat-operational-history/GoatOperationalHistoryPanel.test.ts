import { describe, expect, it } from "vitest";
import { buildOperationalTimeline } from "./goatOperationalHistory.helpers";

describe("GoatOperationalHistoryPanel helpers", () => {
  it("prioriza parto e saída como marcos legíveis do ciclo", () => {
    const timeline = buildOperationalTimeline(
      {
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
      [
        {
          id: 1,
          farmId: 7,
          goatId: "MATRIZ-01",
          pregnancyId: 9,
          eventType: "PREGNANCY_CLOSE",
          eventDate: "2026-03-20",
        },
      ],
      [
        {
          id: 9,
          farmId: 7,
          goatId: "MATRIZ-01",
          status: "CLOSED",
          closeDate: "2026-03-20",
          closeReason: "BIRTH",
        },
      ]
    );

    expect(timeline[0].title).toBe("Saida do rebanho");
    expect(timeline[1].title).toBe("Parto registrado");
    expect(timeline[1].detail).toBe("Parto");
  });

  it("inclui a trilha de auditoria nas operacoes criticas da cabra", () => {
    const timeline = buildOperationalTimeline(
      {
        registrationNumber: "MATRIZ-02",
        name: "Cabra auditada",
        breed: "SAANEN",
        color: "Branca",
        gender: "FEMEA",
        birthDate: "2024-01-01",
        status: "ATIVO",
        category: "PO",
        toe: "002",
        tod: "16432",
        farmId: 7,
      },
      [],
      [],
      [
        {
          id: 10,
          goatRegistrationNumber: "MATRIZ-02",
          actionType: "GOAT_EXIT",
          actionLabel: "Saida do rebanho",
          targetId: "MATRIZ-02",
          description: "Saida auditada",
          actorUserId: 7,
          actorName: "Operador QA",
          actorEmail: "operator@example.com",
          createdAt: "2026-03-28T10:15:00",
        },
      ]
    );

    expect(timeline[0].title).toBe("Saida do rebanho");
    expect(timeline[0].detail).toContain("Operador QA");
  });
});

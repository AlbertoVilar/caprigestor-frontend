import { describe, expect, it } from "vitest";
import { buildFarmOperationalAgenda } from "./farmOperationalAgenda";

describe("buildFarmOperationalAgenda", () => {
  it("combina sinais de sanidade, reprodução e lactação em ordem operacional", () => {
    const summary = buildFarmOperationalAgenda(12, {
      healthAlerts: {
        dueTodayCount: 1,
        upcomingCount: 1,
        overdueCount: 1,
        dueTodayTop: [
          {
            id: 11,
            farmId: 12,
            goatId: "MATRIZ-01",
            type: "VACINACAO",
            status: "AGENDADO",
            title: "Vacinação obrigatória",
            scheduledDate: "2026-03-11",
            overdue: false
          }
        ],
        upcomingTop: [
          {
            id: 12,
            farmId: 12,
            goatId: "MATRIZ-04",
            type: "VERMIFUGACAO",
            status: "AGENDADO",
            title: "Vermifugação",
            scheduledDate: "2026-03-14",
            overdue: false
          }
        ],
        overdueTop: [
          {
            id: 13,
            farmId: 12,
            goatId: "MATRIZ-02",
            type: "EXAME_CLINICO",
            status: "AGENDADO",
            title: "Exame clínico",
            scheduledDate: "2026-03-09",
            overdue: true
          }
        ]
      },
      pregnancyAlerts: {
        totalPending: 1,
        alerts: [
          {
            goatId: "MATRIZ-03",
            eligibleDate: "2026-03-10",
            daysOverdue: 1,
            lastCoverageDate: "2026-02-08",
            lastCheckDate: null
          }
        ]
      },
      dryOffAlerts: {
        totalPending: 1,
        alerts: [
          {
            goatId: "MATRIZ-05",
            dryOffDate: "2026-03-12",
            startDatePregnancy: "2025-10-13",
            breedingDate: "2025-10-10",
            confirmDate: "2025-11-10",
            dryAtPregnancyDays: 140,
            gestationDays: 145,
            daysOverdue: 0,
            dryOffRecommendation: true
          }
        ]
      },
      maxItems: 4
    });

    expect(summary.totalAttention).toBe(5);
    expect(summary.counts.health).toBe(3);
    expect(summary.counts.reproduction).toBe(1);
    expect(summary.counts.lactation).toBe(1);
    expect(summary.items).toHaveLength(4);
    expect(summary.items[0]).toMatchObject({ source: "health", goatId: "MATRIZ-02", overdue: true });
    expect(summary.items[1]).toMatchObject({ source: "reproduction", goatId: "MATRIZ-03", overdue: true });
    expect(summary.items[2]).toMatchObject({ source: "health", goatId: "MATRIZ-01" });
    expect(summary.items[3]).toMatchObject({ source: "lactation", goatId: "MATRIZ-05" });
  });
});

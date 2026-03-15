import { describe, expect, it } from "vitest";
import type { AlertItem } from "./AlertRegistry";
import { filterAndSortAlerts, summarizeBySeverity } from "./farmAlertsSemantics";

const baseItems: AlertItem[] = [
  {
    id: "r-1",
    source: "reproduction",
    title: "Repro 1",
    description: "",
    date: "2026-03-12",
    severity: "high",
    priority: 350
  },
  {
    id: "l-1",
    source: "lactation",
    title: "Lact 1",
    description: "",
    date: "2026-03-11",
    severity: "medium",
    priority: 240
  },
  {
    id: "h-1",
    source: "health",
    title: "Health 1",
    description: "",
    date: "2026-03-10",
    severity: "low",
    priority: 120
  }
];

describe("farmAlertsSemantics", () => {
  it("filters by source", () => {
    const filtered = filterAndSortAlerts(baseItems, "lactation", "all", "priority");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("l-1");
  });

  it("filters by severity", () => {
    const filtered = filterAndSortAlerts(baseItems, "all", "high", "priority");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("r-1");
  });

  it("sorts by priority then date", () => {
    const mixed = [
      ...baseItems,
      {
        id: "r-2",
        source: "reproduction",
        title: "Repro 2",
        description: "",
        date: "2026-03-09",
        severity: "high",
        priority: 350
      }
    ] as AlertItem[];

    const sorted = filterAndSortAlerts(mixed, "all", "all", "priority");
    expect(sorted[0].id).toBe("r-2");
    expect(sorted[1].id).toBe("r-1");
  });

  it("sorts by date then priority", () => {
    const sorted = filterAndSortAlerts(baseItems, "all", "all", "date");
    expect(sorted.map((item) => item.id)).toEqual(["h-1", "l-1", "r-1"]);
  });

  it("builds severity summary", () => {
    expect(summarizeBySeverity(baseItems)).toEqual({
      high: 1,
      medium: 1,
      low: 1
    });
  });
});

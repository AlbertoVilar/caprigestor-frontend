import { describe, expect, it } from "vitest";
import {
  buildFarmAlertsPath,
  buildFarmDashboardPath,
  buildFarmGoatsPath,
  buildFarmHealthAgendaPath,
  buildFarmInventoryPath,
  buildGoatDetailPath,
  buildGoatEventsPath,
  buildGoatHealthPath,
  buildGoatLactationsPath,
  buildGoatMilkProductionsPath,
  buildGoatReproductionPath,
} from "./appRoutes";

describe("appRoutes", () => {
  it("builds canonical farm context paths", () => {
    expect(buildFarmDashboardPath(12)).toBe("/app/goatfarms/12/dashboard");
    expect(buildFarmInventoryPath(12)).toBe("/app/goatfarms/12/inventory");
    expect(buildFarmAlertsPath(12)).toBe("/app/goatfarms/12/alerts");
    expect(buildFarmHealthAgendaPath(12)).toBe("/app/goatfarms/12/health-agenda");
    expect(buildFarmGoatsPath(12)).toBe("/cabras?farmId=12");
  });

  it("builds canonical animal context paths", () => {
    expect(buildGoatDetailPath(7, 99)).toBe("/app/goatfarms/7/goats/99");
    expect(buildGoatHealthPath(7, 99)).toBe("/app/goatfarms/7/goats/99/health");
    expect(buildGoatLactationsPath(7, 99)).toBe("/app/goatfarms/7/goats/99/lactations");
    expect(buildGoatMilkProductionsPath(7, 99)).toBe("/app/goatfarms/7/goats/99/milk-productions");
    expect(buildGoatReproductionPath(7, 99)).toBe("/app/goatfarms/7/goats/99/reproduction");
  });

  it("keeps goat events compatibility with optional farm context", () => {
    expect(buildGoatEventsPath("1615325001")).toBe("/cabras/1615325001/eventos");
    expect(buildGoatEventsPath("1615325001", 7)).toBe("/cabras/1615325001/eventos?farmId=7");
  });

  it("encodes path and query segments safely", () => {
    expect(buildGoatDetailPath(7, "ABC 01")).toBe("/app/goatfarms/7/goats/ABC%2001");
    expect(buildGoatEventsPath("ABC 01", "FARM 1")).toBe(
      "/cabras/ABC%2001/eventos?farmId=FARM%201"
    );
  });
});

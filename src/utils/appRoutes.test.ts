import { describe, expect, it } from "vitest";
import {
  buildFarmAlertsPath,
  buildFarmDashboardPath,
  buildFarmGoatsPath,
  buildFarmHealthAgendaPath,
  buildFarmInventoryPath,
  buildFarmOwnershipTransfersPath,
  buildFarmGoatRegistryPath,
  buildFarmGoatRegistryHistoricalDossierPath,
  buildGoatDetailPath,
  buildGoatEventsPath,
  buildGoatHealthPath,
  buildGoatLactationsPath,
  buildGoatMilkProductionsPath,
  buildGoatReproductionPath,
  buildGoatGenealogyPath,
  buildGoatTechnicalToken,
  isValidGoatTechnicalToken,
  buildPublicFarmPath,
  buildPublicGoatDetailPath,
  resolveFarmContextId,
  resolveGoatInternalRouteId,
} from "./appRoutes";

describe("appRoutes", () => {
  it("uses an explicit technical token for internal structural links", () => {
    expect(buildGoatTechnicalToken(99)).toBe("technical-99");
    expect(resolveGoatInternalRouteId({ technicalId: 99, registrationNumber: "99001" })).toBe("technical-99");
    expect(resolveGoatInternalRouteId({ registrationNumber: "99001" })).toBe("99001");
  });

  it("validates strict technical token format", () => {
    expect(isValidGoatTechnicalToken("technical-1")).toBe(true);
    expect(isValidGoatTechnicalToken("technical-42")).toBe(true);
    expect(isValidGoatTechnicalToken("42")).toBe(false);
    expect(isValidGoatTechnicalToken("RG-123")).toBe(false);
    expect(isValidGoatTechnicalToken("technical-")).toBe(false);
    expect(isValidGoatTechnicalToken("technical-abc")).toBe(false);
    expect(isValidGoatTechnicalToken("technical-0")).toBe(false);
    expect(isValidGoatTechnicalToken("technical--1")).toBe(false);
    expect(isValidGoatTechnicalToken("")).toBe(false);
    expect(isValidGoatTechnicalToken("   ")).toBe(false);
    expect(isValidGoatTechnicalToken(null)).toBe(false);
    expect(isValidGoatTechnicalToken(undefined)).toBe(false);
    expect(isValidGoatTechnicalToken(42)).toBe(false);
  });
  it("builds canonical farm context paths", () => {
    expect(buildFarmDashboardPath(12)).toBe("/app/goatfarms/12/dashboard");
    expect(buildFarmInventoryPath(12)).toBe("/app/goatfarms/12/inventory");
    expect(buildFarmAlertsPath(12)).toBe("/app/goatfarms/12/alerts");
    expect(buildFarmHealthAgendaPath(12)).toBe("/app/goatfarms/12/health-agenda");
    expect(buildFarmOwnershipTransfersPath(12)).toBe("/app/goatfarms/12/ownership-transfers");
    expect(buildFarmGoatRegistryPath(12)).toBe("/app/goatfarms/12/registry");
    expect(buildFarmGoatRegistryPath(7)).toBe("/app/goatfarms/7/registry");
    expect(buildFarmGoatRegistryHistoricalDossierPath(12, 42)).toBe(
      "/app/goatfarms/12/registry/technical-42"
    );
    expect(buildFarmGoatRegistryHistoricalDossierPath(12, "technical-42")).toBe(
      "/app/goatfarms/12/registry/technical-42"
    );
    expect(buildFarmGoatsPath(12)).toBe("/cabras?farmId=12");
    expect(buildPublicFarmPath(12)).toBe("/fazendas/12");
  });

  it("builds canonical animal context paths with technical token for structural ids", () => {
    expect(buildGoatTechnicalToken(42)).toBe("technical-42");
    expect(buildGoatDetailPath(7, buildGoatTechnicalToken(42))).toBe(
      "/app/goatfarms/7/goats/technical-42"
    );
  });

  it("builds canonical animal context paths", () => {
    expect(buildGoatDetailPath(7, 99)).toBe("/app/goatfarms/7/goats/99");
    expect(buildGoatHealthPath(7, 99)).toBe("/app/goatfarms/7/goats/99/health");
    expect(buildGoatLactationsPath(7, 99)).toBe("/app/goatfarms/7/goats/99/lactations");
    expect(buildGoatMilkProductionsPath(7, 99)).toBe("/app/goatfarms/7/goats/99/milk-productions");
    expect(buildGoatReproductionPath(7, 99)).toBe("/app/goatfarms/7/goats/99/reproduction");
    expect(buildPublicGoatDetailPath(7, 99)).toBe("/fazendas/7/animais/99");
    expect(buildGoatGenealogyPath(7, 99)).toBe("/fazendas/7/animais/99/genealogia");
  });

  it("keeps goat events compatibility with optional farm context", () => {
    expect(buildGoatEventsPath("1615325001")).toBe("/cabras/1615325001/eventos");
    expect(buildGoatEventsPath("1615325001", 7)).toBe("/cabras/1615325001/eventos?farmId=7");
  });

  it("encodes path and query segments safely", () => {
    expect(buildGoatDetailPath(7, "ABC 01")).toBe("/app/goatfarms/7/goats/ABC%2001");
    expect(buildPublicGoatDetailPath(7, "ABC 01")).toBe("/fazendas/7/animais/ABC%2001");
    expect(buildGoatEventsPath("ABC 01", "FARM 1")).toBe(
      "/cabras/ABC%2001/eventos?farmId=FARM%201"
    );
  });

  it("resolves the active farm from canonical routes or an explicit query context", () => {
    expect(resolveFarmContextId("/app/goatfarms/14/goats/1615325001/lactations/active")).toBe(14);
    expect(resolveFarmContextId("/cabras", "?farmId=14")).toBe(14);
    expect(resolveFarmContextId("/app/goatfarms/0/dashboard")).toBeUndefined();
    expect(resolveFarmContextId("/app/goatfarms/not-a-number/dashboard")).toBeUndefined();
    expect(resolveFarmContextId("/fazendas")).toBeUndefined();
  });
});

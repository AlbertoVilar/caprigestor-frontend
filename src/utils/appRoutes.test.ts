import { describe, expect, it } from "vitest";
import {
  buildFarmAlertsPath,
  buildFarmDashboardPath,
  buildFarmGoatsPath,
  buildFarmWorkspaceGoatsPath,
  buildFarmHealthAgendaPath,
  buildFarmInventoryPath,
  buildFarmReportsPath,
  buildFarmOwnershipTransfersPath,
  buildFarmOwnershipMovementsPath,
  buildFarmGoatRegistryPath,
  buildFarmGoatRegistryHistoricalDossierPath,
  buildGoatDetailPath,
  buildGoatEventsPath,
  buildGoatHealthPath,
  buildGoatLactationsPath,
  buildGoatMilkProductionsPath,
  buildGoatReproductionPath,
  buildPrivateGoatEventsPath,
  buildPrivateGoatGenealogyPath,
  buildGoatHealthCreatePath,
  buildGoatHealthEventPath,
  buildGoatHealthEventEditPath,
  buildGoatLactationActivePath,
  buildGoatLactationDetailPath,
  buildGoatLactationSummaryPath,
  buildGoatReproductionEventsPath,
  buildGoatPregnancyDetailPath,
  buildGoatGenealogyPath,
  buildGoatTechnicalToken,
  isValidGoatTechnicalToken,
  buildPublicFarmPath,
  buildPublicGoatDetailPath,
  buildManagedFarmsPath,
  resolveExplicitLoginDestination,
  resolveFarmContextId,
  resolveGoatInternalRouteId,
  resolveLoginDestination,
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
    expect(buildManagedFarmsPath()).toBe("/app/goatfarms");
    expect(buildFarmDashboardPath(12)).toBe("/app/goatfarms/12/dashboard");
    expect(buildFarmInventoryPath(12)).toBe("/app/goatfarms/12/inventory");
    expect(buildFarmReportsPath(12)).toBe("/app/goatfarms/12/reports");
    expect(buildFarmAlertsPath(12)).toBe("/app/goatfarms/12/alerts");
    expect(buildFarmHealthAgendaPath(12)).toBe("/app/goatfarms/12/health-agenda");
    expect(buildFarmOwnershipTransfersPath(12)).toBe("/app/goatfarms/12/ownership-transfers");
    expect(buildFarmOwnershipMovementsPath(12)).toBe("/app/goatfarms/12/ownership-movements");
    expect(buildFarmGoatRegistryPath(12)).toBe("/app/goatfarms/12/registry");
    expect(buildFarmGoatRegistryPath(7)).toBe("/app/goatfarms/7/registry");
    expect(buildFarmGoatRegistryHistoricalDossierPath(12, 42)).toBe(
      "/app/goatfarms/12/registry/technical-42"
    );
    expect(buildFarmGoatRegistryHistoricalDossierPath(12, "technical-42")).toBe(
      "/app/goatfarms/12/registry/technical-42"
    );
    expect(buildFarmGoatsPath(12)).toBe("/cabras?farmId=12");
    expect(buildFarmWorkspaceGoatsPath(12)).toBe("/app/goatfarms/12/goats");
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
    expect(buildPrivateGoatEventsPath(7, 99)).toBe("/app/goatfarms/7/goats/99/events");
    expect(buildPrivateGoatGenealogyPath(7, 99)).toBe("/app/goatfarms/7/goats/99/genealogy");
    expect(buildGoatHealthCreatePath(7, 99)).toBe("/app/goatfarms/7/goats/99/health/new");
    expect(buildGoatHealthEventPath(7, 99, 4)).toBe("/app/goatfarms/7/goats/99/health/4");
    expect(buildGoatHealthEventEditPath(7, 99, 4)).toBe("/app/goatfarms/7/goats/99/health/4/edit");
    expect(buildGoatLactationActivePath(7, 99)).toBe("/app/goatfarms/7/goats/99/lactations/active");
    expect(buildGoatLactationDetailPath(7, 99, 4)).toBe("/app/goatfarms/7/goats/99/lactations/4");
    expect(buildGoatLactationSummaryPath(7, 99, 4)).toBe("/app/goatfarms/7/goats/99/lactations/4/summary");
    expect(buildGoatReproductionEventsPath(7, 99)).toBe("/app/goatfarms/7/goats/99/reproduction/events");
    expect(buildGoatPregnancyDetailPath(7, 99, 4)).toBe("/app/goatfarms/7/goats/99/reproduction/pregnancies/4");
    expect(buildPublicGoatDetailPath(7, 99)).toBe("/fazendas/7/animais/99");
    expect(buildGoatGenealogyPath(7, 99)).toBe("/fazendas/7/animais/99/genealogia");
  });

  it("keeps explicit return contracts for every private animal module", () => {
    const farmId = 14;
    const goatId = "technical-42";
    expect(buildGoatHealthPath(farmId, goatId)).toBe("/app/goatfarms/14/goats/technical-42/health");
    expect(buildGoatHealthEventPath(farmId, goatId, 9)).toBe("/app/goatfarms/14/goats/technical-42/health/9");
    expect(buildGoatHealthCreatePath(farmId, goatId)).toBe("/app/goatfarms/14/goats/technical-42/health/new");
    expect(buildGoatHealthEventEditPath(farmId, goatId, 9)).toBe("/app/goatfarms/14/goats/technical-42/health/9/edit");
    expect(buildGoatReproductionPath(farmId, goatId)).toBe("/app/goatfarms/14/goats/technical-42/reproduction");
    expect(buildGoatReproductionEventsPath(farmId, goatId)).toBe("/app/goatfarms/14/goats/technical-42/reproduction/events");
    expect(buildGoatPregnancyDetailPath(farmId, goatId, 5)).toBe("/app/goatfarms/14/goats/technical-42/reproduction/pregnancies/5");
    expect(buildGoatLactationsPath(farmId, goatId)).toBe("/app/goatfarms/14/goats/technical-42/lactations");
    expect(buildGoatLactationActivePath(farmId, goatId)).toBe("/app/goatfarms/14/goats/technical-42/lactations/active");
    expect(buildGoatLactationDetailPath(farmId, goatId, 3)).toBe("/app/goatfarms/14/goats/technical-42/lactations/3");
    expect(buildGoatLactationSummaryPath(farmId, goatId, 3)).toBe("/app/goatfarms/14/goats/technical-42/lactations/3/summary");
    expect(buildGoatMilkProductionsPath(farmId, goatId)).toBe("/app/goatfarms/14/goats/technical-42/milk-productions");
    expect(buildPrivateGoatEventsPath(farmId, goatId)).toBe("/app/goatfarms/14/goats/technical-42/events");
    expect(buildPrivateGoatGenealogyPath(farmId, goatId)).toBe("/app/goatfarms/14/goats/technical-42/genealogy");
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

  it("accepts only internal login destinations and preserves query/hash context", () => {
    expect(
      resolveLoginDestination({
        pathname: "/app/goatfarms/1/commercial",
        search: "?tab=finance",
        hash: "#receivables",
      })
    ).toBe("/app/goatfarms/1/commercial?tab=finance#receivables");
    expect(resolveLoginDestination({ pathname: "/app/goatfarms/1/dashboard" })).toBe(
      "/app/goatfarms/1/dashboard"
    );
  });

  it("rejects external, protocol-relative and malformed login destinations", () => {
    expect(resolveLoginDestination("https://evil.example")).toBe("/fazendas");
    expect(resolveLoginDestination({ pathname: "//evil.example" })).toBe("/fazendas");
    expect(resolveLoginDestination({ pathname: "javascript:alert(1)" })).toBe("/fazendas");
    expect(resolveLoginDestination({ pathname: "/app", search: "tab=finance" })).toBe("/fazendas");
    expect(resolveLoginDestination({ pathname: "/app", hash: "receivables" })).toBe("/fazendas");
  });

  it("distinguishes a valid explicit return from direct-login landing", () => {
    expect(resolveExplicitLoginDestination({ pathname: "/app/goatfarms/1/dashboard" })).toBe(
      "/app/goatfarms/1/dashboard"
    );
    expect(resolveExplicitLoginDestination(undefined)).toBeUndefined();
    expect(resolveExplicitLoginDestination({ pathname: "https://evil.example" })).toBeUndefined();
  });
});

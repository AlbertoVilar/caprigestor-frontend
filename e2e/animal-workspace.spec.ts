import { expect, test, type Page } from "@playwright/test";

function token(): string {
  const enc = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${enc({ alg: "HS256", typ: "JWT" })}.${enc({ sub: "owner@caprigestor.local", userId: 7, authorities: ["ROLE_FARM_OWNER"], exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`;
}

function operatorToken(): string {
  const enc = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${enc({ alg: "HS256", typ: "JWT" })}.${enc({ sub: "operator@caprigestor.local", userId: 8, authorities: ["ROLE_OPERATOR"], exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`;
}

async function mockAnimalWorkspaceApi(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^.*\/api\/v1/, "");
    const workspaceGoat = { technicalId: 42, id: 42, registrationNumber: "1400820006", name: "Corista da Bocaina", gender: "F", status: "ATIVO", farmId: 14, farmName: "Capril Alto Paraíso", breed: "Saanen", color: "Branca", category: "PO", birthDate: "2020-01-01", tod: "14008", toe: "20006" };
    const body = path === "/goatfarms/managed" ? { content: [{ id: 14, name: "Capril Alto Paraíso", tod: "16153", logoUrl: null }], page: { size: 12, number: 0, totalPages: 1, totalElements: 1 } }
      : path === "/goatfarms/14" ? { id: 14, name: "Capril Alto Paraíso", tod: "16153", logoUrl: null }
      : path === "/goatfarms/14/permissions" ? { canOperateFarm: true, canAdministerFarm: true }
      : path === "/goatfarms/14/goats/summary" ? { total: 1, males: 0, females: 1, active: 1, inactive: 0, sold: 0, deceased: 0, breeds: [{ breed: "Saanen", count: 1 }] }
      : path === "/goatfarms/14/goats" ? { content: [workspaceGoat], number: 0, totalPages: 1, totalElements: 1, size: 12, first: true, last: true }
      : path.includes("/genealogies") ? {
          animalPrincipal: { nome: "Corista da Bocaina", registro: "1400820006", criador: "Capril Alto Paraíso", proprietario: "Capril Alto Paraíso", raca: "Saanen", pelagem: "Branca", situacao: "ATIVO", sexo: "F", categoria: "PO", tod: "14008", toe: "20006", dataNasc: "2020-01-01", source: "LOCAL" },
          pai: null, mae: null, avoPaterno: null, avoPaterna: null, avoMaterno: null, avoMaterna: null,
          bisavosPaternos: [], bisavosMaternos: [], integration: null,
        }
      : path.includes("/goats/technical-42") ? workspaceGoat
      : {
          content: [], totalElements: 0, totalPages: 0,
          page: { size: 1, number: 0, totalPages: 0, totalElements: 0 },
          alerts: [], totalPending: 0,
          dueTodayCount: 0, overdueCount: 0, upcomingCount: 0,
          activeMilkWithdrawalCount: 0, activeMeatWithdrawalCount: 0,
          milkWithdrawalTop: [], meatWithdrawalTop: [], dueTodayTop: [],
          overdueTop: [], upcomingTop: [],
        };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
}

test("keeps private animal identity while switching modules", async ({ page }) => {
  await page.addInitScript((authToken) => window.localStorage.setItem("authToken", authToken), token());
  await mockAnimalWorkspaceApi(page);

  await page.goto("/app/goatfarms");
  await expect(page.getByRole("heading", { name: "Escolha onde você vai trabalhar" })).toBeVisible();
  await page.getByRole("button", { name: "Acessar gestão" }).click();
  await expect(page).toHaveURL(/\/app\/goatfarms\/14\/dashboard$/);
  await expect(page.locator(".farm-workspace__header").getByRole("heading", { name: "Capril Alto Paraíso" })).toBeVisible();
  await page.getByRole("navigation", { name: "Módulos da fazenda" }).getByRole("link", { name: "Rebanho" }).click();
  await expect(page).toHaveURL(/\/app\/goatfarms\/14\/goats$/);
  await page.getByRole("link", { name: "Gerenciar o animal Corista da Bocaina", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/goatfarms\/14\/goats\/technical-42$/);
  await expect(page.locator(".animal-workspace__header").getByRole("heading", { name: "Corista da Bocaina" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Módulos do animal" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Eventos" })).toHaveAttribute("href", "/app/goatfarms/14/goats/technical-42/events");

  await page.getByRole("link", { name: "Eventos" }).click();
  await expect(page).toHaveURL(/\/app\/goatfarms\/14\/goats\/technical-42\/events$/);
  await page.getByRole("navigation", { name: "Módulos do animal" }).getByRole("link", { name: "Visão geral" }).click();
  await expect(page).toHaveURL(/\/app\/goatfarms\/14\/goats\/technical-42$/);

  for (const [label, suffix] of [["Saúde", "health"], ["Reprodução", "reproduction"], ["Lactações", "lactations"], ["Leite", "milk-productions"], ["Genealogia", "genealogy"]] as const) {
    await page.getByRole("navigation", { name: "Módulos do animal" }).getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`/app/goatfarms/14/goats/technical-42/${suffix}$`));
    expect(page.url()).not.toContain("/fazendas");
    expect(page.url()).not.toMatch(/\/cabras(?:\/|\?|$)/);
  }

  await expect(page.getByRole("link", { name: "Ver genealogia pública" })).toHaveAttribute("href", "/fazendas/14/animais/1400820006/genealogia");

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("keeps the same animal workspace contract for a linked operator", async ({ page }) => {
  await page.addInitScript((authToken) => window.localStorage.setItem("authToken", authToken), operatorToken());
  await mockAnimalWorkspaceApi(page);
  await page.goto("/app/goatfarms/14/goats/technical-42");
  await expect(page.locator(".animal-workspace__header").getByRole("heading", { name: "Corista da Bocaina" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Módulos do animal" }).getByRole("link", { name: "Eventos" })).toBeVisible();
  await page.getByRole("navigation", { name: "Módulos do animal" }).getByRole("link", { name: "Saúde" }).click();
  await expect(page).toHaveURL(/\/app\/goatfarms\/14\/goats\/technical-42\/health$/);
});

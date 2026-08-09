import { expect, test } from "@playwright/test";

const farm = {
  id: 14,
  name: "Capril Alto Paraíso",
  tod: "16153",
  logoUrl: null,
  user: { id: 20, name: "Leonardo Oliveira", email: "contato@altoparaiso.example" },
  address: { id: 30, city: "Santo André", state: "PB", country: "Brasil" },
  phones: [{ id: 40, ddd: "21", number: "987445214" }],
};

const goat = {
  registrationNumber: "1615325001",
  name: "ACRICOSA MAGESTADE",
  breed: "SAANEN",
  color: "Branca",
  gender: "FEMEA",
  birthDate: "2025-01-07",
  status: "ATIVO",
  category: "PA",
  toe: "25001",
  tod: "16153",
  farmId: 14,
  farmName: "Capril Alto Paraíso",
};

test("keeps farm, animal and genealogy public without loading private operations", async ({ page }) => {
  let privateCalls = 0;

  await page.route("**/goatfarms/14", (route) => route.fulfill({ json: farm }));
  await page.route("**/goatfarms/14/goats?*", (route) => route.fulfill({
    json: { content: [goat], number: 0, totalPages: 1, totalElements: 1 },
  }));
  await page.route("**/goatfarms/14/goats/summary", (route) => route.fulfill({
    json: { total: 1, females: 1, males: 0, active: 1, inactive: 0, sold: 0, deceased: 0, breeds: [] },
  }));
  await page.route("**/goatfarms/14/goats/1615325001", (route) => route.fulfill({ json: goat }));
  await page.route("**/goatfarms/14/goats/1615325001/genealogies**", (route) => route.fulfill({
    json: {
      animalPrincipal: { nome: goat.name, registro: goat.registrationNumber, source: "LOCAL" },
      pai: null,
      mae: null,
      avoPaterno: null,
      avoPaterna: null,
      avoMaterno: null,
      avoMaterna: null,
      bisavosPaternos: [],
      bisavosMaternos: [],
    },
  }));

  for (const pattern of [
    "**/goatfarms/14/health-events/alerts**",
    "**/goatfarms/14/reproduction/alerts/**",
    "**/goatfarms/14/milk/alerts/**",
  ]) {
    await page.route(pattern, (route) => {
      privateCalls += 1;
      return route.fulfill({ status: 401, json: { message: "unauthorized" } });
    });
  }

  await page.goto("/fazendas/14");
  await expect(page.getByRole("heading", { name: farm.name, level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: farm.user.email })).toHaveAttribute("href", `mailto:${farm.user.email}`);
  await expect(page.getByRole("link", { name: "Área do proprietário" })).toBeVisible();

  await page.getByRole("link", { name: "Ver animais" }).click();
  await expect(page.getByRole("heading", { name: "Animais da fazenda" })).toBeVisible();
  await expect(page.getByText(goat.name)).toBeVisible();
  await expect(page.getByText(/Sessão expirada|Sessao expirada/)).toHaveCount(0);

  await page.locator(`a[href="/fazendas/14/animais/${goat.registrationNumber}"]`).first().click();
  await expect(page.getByRole("heading", { name: goat.name, level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Consultar genealogia" }).click();
  await expect(page.getByRole("heading", { name: "Visualização completa" })).toBeVisible();
  expect(privateCalls).toBe(0);

  await page.goto("/rota-que-nao-existe");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});

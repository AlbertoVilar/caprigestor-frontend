import { expect, test } from "@playwright/test";

function buildAuthToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: "operator@caprigestor.local",
    user_name: "operator@caprigestor.local",
    userId: 1,
    authorities: ["ROLE_ADMIN", "ROLE_OPERATOR"],
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  return `${header}.${payload}.signature`;
}

const emptyPage = {
  content: [],
  page: { number: 0, size: 100, totalElements: 0, totalPages: 0 },
};

test("registers an inventory purchase with calculated freight and discount", async ({ page }) => {
  await page.addInitScript((token: string) => {
    window.localStorage.setItem("authToken", token);
  }, buildAuthToken());

  let postedPayload: Record<string, unknown> | null = null;

  await page.route("**/goatfarms/1/inventory/items**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: [{ id: 101, name: "Ração Premium", trackLot: false, active: true }],
        page: { number: 0, size: 100, totalElements: 1, totalPages: 1 },
      }),
    });
  });

  await page.route("**/goatfarms/1/inventory/lots**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(emptyPage),
  }));
  await page.route("**/goatfarms/1/inventory/balances**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(emptyPage),
  }));
  await page.route("**/goatfarms/1/inventory/movements**", async (route) => {
    if (route.request().method() === "POST") {
      postedPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          movementId: 9001,
          type: "IN",
          quantity: 32.143,
          itemId: 101,
          movementDate: "2026-08-01",
          resultingBalance: 32.143,
          unitCost: 112,
          subtotalCost: 3600.02,
          freightCost: 45.5,
          discountAmount: 12.25,
          totalCost: 3633.27,
          purchaseDate: "2026-08-01",
          supplierName: "Durrancho",
          createdAt: "2026-08-01T12:00:00Z",
        }),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(emptyPage) });
  });

  await page.route(/\/goatfarms\/1(?:\?.*)?$/, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ id: 1, name: "Capril Vilar" }),
  }));

  await page.route("**/goatfarms/1/**/alerts**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ alerts: [], totalPending: 0, overdue: [], dueToday: [], upcoming: [] }),
  }));

  await page.goto("/app/goatfarms/1/inventory");
  await expect(page.getByRole("heading", { name: "Estoque" })).toBeVisible();

  await page.getByRole("combobox").nth(0).selectOption("101");
  await page.getByRole("combobox").nth(1).selectOption("IN");
  await page.locator('input[type="number"]').first().fill("32.143");
  await page.getByRole("switch", { name: /Esta entrada é uma compra/ }).check();
  await page.getByLabel("Custo unitário").fill("112");
  await page.getByLabel("Frete").fill("45.50");
  await page.getByLabel("Desconto").fill("12.25");
  await page.getByLabel("Data da compra").fill("2026-08-01");
  await page.getByLabel("Fornecedor").fill("Durrancho");

  await expect(page.getByText("R$ 3.633,27")).toBeVisible();
  await page.getByRole("button", { name: "Registrar movimentação" }).click();

  await expect(page.getByText("Movimentação registrada com sucesso.").first()).toBeVisible();
  expect(postedPayload).toMatchObject({
    type: "IN",
    quantity: 32.143,
    itemId: 101,
    unitCost: 112,
    freightCost: 45.5,
    discountAmount: 12.25,
    purchaseDate: "2026-08-01",
    supplierName: "Durrancho",
  });
  expect(postedPayload).not.toHaveProperty("totalCost");
});

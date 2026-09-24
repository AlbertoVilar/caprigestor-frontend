import { expect, test } from "@playwright/test";

function buildAuthToken(authorities = ["ROLE_FARM_OWNER"]): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: "owner@caprigestor.local",
    user_name: "owner@caprigestor.local",
    userId: 7,
    authorities,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  return `${header}.${payload}.signature`;
}

test("keeps farm workspace context while navigating first-level modules", async ({ page }) => {
  await page.addInitScript((token) => {
    window.localStorage.setItem("authToken", token);
  }, buildAuthToken());

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, "");
    const json = (body: unknown, status = 200) => route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });

    if (path === "/goatfarms/14/permissions") {
      return json({ canOperateFarm: true, canAdministerFarm: true });
    }

    if (path === "/goatfarms/14") {
      return json({
        id: 14,
        name: "Capril Alto Paraíso",
        tod: "16153",
        logoUrl: null,
        city: "Santo André",
        state: "PB",
      });
    }

    if (path === "/goatfarms/14/goats/summary") {
      return json({ total: 0, females: 0, males: 0, active: 0, inactive: 0, sold: 0, deceased: 0, breeds: [] });
    }

    if (path === "/goatfarms/14/goats") {
      return json({ content: [], number: 0, totalPages: 0, totalElements: 0 });
    }

    if (path.includes("/health-events/alerts")) {
      return json({
        dueTodayCount: 0,
        upcomingCount: 0,
        overdueCount: 0,
        activeMilkWithdrawalCount: 0,
        activeMeatWithdrawalCount: 0,
        milkWithdrawalTop: [],
        meatWithdrawalTop: [],
        dueTodayTop: [],
        upcomingTop: [],
        overdueTop: [],
      });
    }

    if (path.includes("/reproduction/alerts") || path.includes("/milk/alerts")) {
      return json({ content: [], totalElements: 0, totalPages: 0, alerts: [], totalPending: 0 });
    }

    return json({ content: [], totalElements: 0, totalPages: 0 });
  });

  await page.route("**/api/v1/goatfarms/managed**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: [{ id: 14, name: "Capril Alto Paraíso", tod: "16153", logoUrl: null }],
        page: { number: 0, totalPages: 1, totalElements: 1 },
      }),
    });
  });

  await page.goto("/app/goatfarms");
  await expect(page.getByRole("heading", { name: "Escolha onde você vai trabalhar" })).toBeVisible();
  await page.getByRole("button", { name: "Acessar gestão" }).click();
  await expect(page).toHaveURL(/\/app\/goatfarms\/14\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Capril Alto Paraíso", level: 1 }).first()).toBeVisible();
  await expect(page.getByText("TOD 16153")).toBeVisible();
  await expect(page.getByRole("link", { name: "Comercial" }).first()).toHaveAttribute(
    "href",
    "/app/goatfarms/14/commercial"
  );
  await expect(page.getByRole("link", { name: "Relatórios" }).first()).toHaveAttribute(
    "href",
    "/app/goatfarms/14/reports"
  );

  await page.getByRole("link", { name: "Comercial" }).first().click();
  await expect(page).toHaveURL(/\/app\/goatfarms\/14\/commercial$/);
  await expect(page.getByRole("heading", { name: "Capril Alto Paraíso", level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "Estoque" }).first().click();
  await expect(page).toHaveURL(/\/app\/goatfarms\/14\/inventory$/);
  await expect(page.getByText("TOD 16153")).toBeVisible();

  await page.getByRole("link", { name: "Relatórios" }).first().click();
  await expect(page).toHaveURL(/\/app\/goatfarms\/14\/reports$/);
  await expect(page.getByRole("heading", { name: "Capril Alto Paraíso", level: 1 })).toBeVisible();
  expect(page.url()).not.toContain("/fazendas");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Capril Alto Paraíso", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trocar fazenda" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Relatórios" })).toHaveAttribute(
    "aria-current",
    "page"
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Trocar fazenda" }).click();
  await expect(page).toHaveURL(/\/app\/goatfarms$/);
});

test("keeps Transferências out of the linked operator workspace", async ({ page }) => {
  await page.addInitScript((token) => {
    window.localStorage.setItem("authToken", token);
  }, buildAuthToken(["ROLE_OPERATOR"]));

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, "");
    const json = (body: unknown, status = 200) => route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });

    if (path === "/goatfarms/14/permissions") {
      return json({ canOperateFarm: true, canAdministerFarm: false });
    }

    if (path === "/goatfarms/14") {
      return json({ id: 14, name: "Capril Alto Paraíso", tod: "16153", logoUrl: null });
    }

    if (path.includes("/health-events/alerts")) {
      return json({
        dueTodayCount: 0,
        upcomingCount: 0,
        overdueCount: 0,
        activeMilkWithdrawalCount: 0,
        activeMeatWithdrawalCount: 0,
        milkWithdrawalTop: [],
        meatWithdrawalTop: [],
        dueTodayTop: [],
        upcomingTop: [],
        overdueTop: [],
      });
    }

    return json({ content: [], totalElements: 0, totalPages: 0 });
  });

  await page.goto("/app/goatfarms/14/dashboard");
  await expect(page.getByRole("heading", { name: "Capril Alto Paraíso", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Comercial" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Transferências" })).toHaveCount(0);
});

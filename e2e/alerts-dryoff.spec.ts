import { expect, test } from "@playwright/test";

function buildAuthToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "operator@caprigestor.local",
      user_name: "operator@caprigestor.local",
      userId: 1,
      authorities: ["ROLE_ADMIN", "ROLE_OPERATOR"],
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString("base64url");

  return `${header}.${payload}.signature`;
}

test("renders dry-off alerts page and drawer using farm-level endpoints", async ({ page }) => {
  const token = buildAuthToken();
  await page.addInitScript((authToken: string) => {
    window.localStorage.setItem("authToken", authToken);
  }, token);

  let dryOffFarmCalls = 0;
  let goatScopedDryOffCalls = 0;

  await page.route("**/goatfarms/1/goats/**/milk/alerts/dry-off**", async (route) => {
    goatScopedDryOffCalls += 1;
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: "not found" }),
    });
  });

  await page.route("**/goatfarms/1/milk/alerts/dry-off**", async (route) => {
    dryOffFarmCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalPending: 2,
        alerts: [
          {
            goatId: "GOAT-001",
            startDatePregnancy: "2025-10-20",
            dryOffDate: "2026-02-10",
            gestationDays: 113,
            daysOverdue: 5,
          },
          {
            goatId: "GOAT-002",
            startDatePregnancy: "2025-10-25",
            dryOffDate: "2026-02-11",
            gestationDays: 108,
            daysOverdue: 0,
          },
        ],
      }),
    });
  });

  await page.route("**/goatfarms/1/reproduction/alerts/pregnancy-diagnosis**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalPending: 1,
        alerts: [
          {
            goatId: "GOAT-003",
            lastCoverageDate: "2025-12-05",
            eligibleDate: "2026-01-10",
            daysOverdue: 10,
          },
        ],
      }),
    });
  });

  await page.route("**/goatfarms/1/health-events/alerts**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        overdueCount: 0,
        dueTodayCount: 0,
        upcomingCount: 0,
        overdue: [],
        dueToday: [],
        upcoming: [],
      }),
    });
  });

  await page.goto("/app/goatfarms/1/alerts?type=lactation_drying");

  await expect(page.getByRole("heading", { name: "Alertas e Pendencias" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Cabra" })).toBeVisible();
  await expect(page.getByText("GOAT-001")).toBeVisible();
  await expect(page.getByText("+5 dia(s)")).toBeVisible();
  const dryOffLinks = page.getByRole("link", { name: "Ver lactacao" });
  await expect(dryOffLinks).toHaveCount(2);
  await expect(dryOffLinks.first()).toBeVisible();

  await page.getByTitle("Alertas da Fazenda").click();
  const drawer = page.getByRole("dialog", { name: "Alertas da Fazenda" });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator(".alert-item-title", { hasText: "Secagem (Lactacao)" })).toBeVisible();
  await expect(drawer.getByText("2 cabra(s) com secagem pendente")).toBeVisible();

  expect(dryOffFarmCalls).toBeGreaterThanOrEqual(2);
  expect(goatScopedDryOffCalls).toBe(0);
});

import { test, expect } from "@playwright/test";

const enabled = process.env.F0_1_REAL_E2E === "true";
const required = [
  "F0_1_LINKED_OPERATOR_EMAIL",
  "F0_1_LINKED_OPERATOR_PASSWORD",
  "F0_1_FARM_A_ID",
];

test.describe("F0.1 full-stack authorization contract", () => {
  test.skip(!enabled || required.some((name) => !process.env[name]), "Requires a disposable real backend environment");

  test("frontend login uses real backend and reads linked-operator capability", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[autocomplete="username"]').fill(process.env.F0_1_LINKED_OPERATOR_EMAIL!);
    await page.locator('input[autocomplete="current-password"]').fill(process.env.F0_1_LINKED_OPERATOR_PASSWORD!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(/\/fazendas$/);

    await expect.poll(async () => page.evaluate(() => localStorage.getItem("authToken"))).toEqual(expect.any(String));
    await expect.poll(async () => page.evaluate(() => localStorage.getItem("refreshToken"))).toEqual(expect.any(String));

    const permissions = await page.evaluate(async ({ farmId, apiBase }) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${apiBase}/goatfarms/${farmId}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: response.status, body: await response.json() };
    }, {
      farmId: process.env.F0_1_FARM_A_ID,
      apiBase: process.env.F0_1_BASE_URL ?? "http://127.0.0.1:18080/api/v1",
    });

    expect(permissions.status).toBe(200);
    expect(permissions.body).toEqual({ canOperateFarm: true, canAdministerFarm: false });
  });
});

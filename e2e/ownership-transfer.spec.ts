import { expect, test, type Page } from "@playwright/test";
import type {
  OwnershipTransferPageDTO,
  OwnershipTransferResponseDTO,
} from "../src/Models/OwnershipTransferDTOs";

function buildAuthToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: "owner@caprigestor.local",
    user_name: "owner@caprigestor.local",
    userId: 7,
    authorities: ["ROLE_FARM_OWNER"],
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  return `${header}.${payload}.signature`;
}

type TransferState = {
  status: "REQUESTED" | "COMPLETED";
  requestStatus: number;
  acceptStatus: number;
  permissionAllowed: boolean;
  transferListCalls: number;
  postPayloads: Array<Record<string, unknown>>;
};

function transferPayload(state: TransferState): OwnershipTransferResponseDTO {
  return {
    id: 900,
    goatId: 41,
    sourceFarmId: 10,
    targetFarmId: 20,
    kind: "INTERNAL_TRANSFER",
    status: state.status,
    reason: "venda entre fazendas",
    requestedAt: "2026-09-14T10:00:00Z",
    acceptedAt: state.status === "COMPLETED" ? "2026-09-14T10:01:00Z" : null,
    effectiveAt: state.status === "COMPLETED" ? "2026-09-14T10:01:00Z" : null,
    completedAt: state.status === "COMPLETED" ? "2026-09-14T10:01:00Z" : null,
    cancelledAt: null,
  };
}

async function setupApi(page: Page, overrides: Partial<TransferState> = {}) {
  const state: TransferState = {
    status: "REQUESTED",
    requestStatus: 201,
    acceptStatus: 200,
    permissionAllowed: true,
    transferListCalls: 0,
    postPayloads: [],
    ...overrides,
  };

  await page.addInitScript((authToken) => {
    window.localStorage.setItem("authToken", authToken);
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

    if (path.match(/^\/goatfarms\/(10|20)\/permissions$/)) {
      return json({ canOperateFarm: state.permissionAllowed, canAdministerFarm: state.permissionAllowed });
    }

    if (request.method() === "GET" && path === "/goatfarms") {
      return json([{ id: 10, name: "Fazenda A" }, { id: 20, name: "Fazenda B" }]);
    }

    if (request.method() === "GET" && path.match(/^\/goatfarms\/(10|20)$/)) {
      const farmId = Number(path.split("/")[2]);
      return json({ id: farmId, name: farmId === 10 ? "Fazenda A" : "Fazenda B" });
    }

    if (request.method() === "GET" && path.match(/^\/goatfarms\/(10|20)\/goats\/[^/]+$/)) {
      const farmId = Number(path.split("/")[2]);
      if ((farmId === 10 && state.status === "COMPLETED") || (farmId === 20 && state.status !== "COMPLETED")) {
        return json({ message: "Animal não encontrado" }, 404);
      }
      return json({
        technicalId: 41,
        id: 7,
        registrationNumber: "RG-41",
        name: "Cabra 41",
        breed: "Saanen",
        color: "Branca",
        gender: "Fêmea",
        birthDate: "2025-01-01",
        status: "Ativo",
        category: "PO",
        toe: "1",
        tod: "2",
        farmId,
        farmName: farmId === 10 ? "Fazenda A" : "Fazenda B",
      });
    }

    if (request.method() === "GET" && path.match(/^\/goatfarms\/(10|20)\/ownership-transfers$/)) {
      state.transferListCalls += 1;
      const farmId = Number(path.split("/")[2]);
      const direction = url.searchParams.get("direction");
      const visible = (farmId === 10 && direction === "OUTGOING") || (farmId === 20 && direction === "INCOMING");
      const response: OwnershipTransferPageDTO = {
        content: visible ? [transferPayload(state)] : [],
        totalElements: visible ? 1 : 0,
        totalPages: visible ? 1 : 0,
        number: 0,
        size: 10,
      };
      return json(response);
    }

    if (request.method() === "POST" && path === "/ownership-transfers") {
      state.postPayloads.push(request.postDataJSON() as Record<string, unknown>);
      if (state.requestStatus !== 201) return json({ message: "Requisição inválida" }, state.requestStatus);
      return json(transferPayload(state), 201);
    }

    if (request.method() === "POST" && path === "/ownership-transfers/900/accept") {
      if (state.acceptStatus !== 200) return json({ message: "Ação não autorizada" }, state.acceptStatus);
      state.status = "COMPLETED";
      return json(transferPayload(state));
    }

    return json({ message: "Not mocked" }, 404);
  });

  return state;
}

test.describe("ownership transfer integration", () => {
  test("requests, accepts and projects an internal transfer across both farms", async ({ page }) => {
    const state = await setupApi(page);

    await page.goto("/app/goatfarms/10/goats/technical-41");
    await expect(page.getByRole("button", { name: "Transferir propriedade" })).toBeVisible();
    await page.getByRole("button", { name: "Transferir propriedade" }).click();
    const dialog = page.getByRole("dialog", { name: "Transferir propriedade" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Fazenda de destino").selectOption("20");
    await dialog.getByLabel("Motivo").fill("venda entre fazendas");
    page.once("dialog", (browserDialog) => browserDialog.accept());
    await dialog.getByRole("button", { name: "Enviar solicitação" }).click();

    await expect.poll(() => state.postPayloads.length).toBe(1);
    expect(state.postPayloads[0]).toMatchObject({
      goatId: 41,
      targetFarmId: 20,
      reason: "venda entre fazendas",
    });
    expect(state.postPayloads[0]).not.toHaveProperty("sourceFarmId");
    await expect(dialog).toBeHidden();

    await page.goto("/app/goatfarms/10/ownership-transfers");
    await page.getByRole("button", { name: "Saída" }).click();
    await expect(page.locator(".ownership-transfer-status", { hasText: "Solicitada" })).toBeVisible();
    await page.goto("/app/goatfarms/20/ownership-transfers");
    await expect(page.locator(".ownership-transfer-status", { hasText: "Solicitada" })).toBeVisible();
    page.once("dialog", (browserDialog) => browserDialog.accept());
    await page.getByRole("button", { name: "Aceitar" }).click();
    await expect(page.locator(".ownership-transfer-status", { hasText: "Concluída" })).toBeVisible();

    await page.goto("/app/goatfarms/10/goats/technical-41");
    await expect(page.getByRole("heading", { name: "Nenhum animal selecionado" })).toBeVisible();
    await page.goto("/app/goatfarms/20/goats/technical-41");
    await expect(page.getByRole("heading", { name: "Cabra 41" })).toBeVisible();
  });

  test("keeps the request form usable after a 422 response", async ({ page }) => {
    const state = await setupApi(page, { requestStatus: 422 });
    await page.goto("/app/goatfarms/10/goats/technical-41");
    await page.getByRole("button", { name: "Transferir propriedade" }).click();
    const dialog = page.getByRole("dialog", { name: "Transferir propriedade" });
    await dialog.getByLabel("Fazenda de destino").selectOption("20");
    await dialog.getByLabel("Motivo").fill("motivo preservado");
    page.once("dialog", (browserDialog) => browserDialog.accept());
    await dialog.getByRole("button", { name: "Enviar solicitação" }).click();
    await expect(dialog.getByLabel("Motivo")).toHaveValue("motivo preservado");
    expect(state.postPayloads).toHaveLength(1);
  });

  test("does not change a requested transfer after a 403 decision failure", async ({ page }) => {
    const state = await setupApi(page, { acceptStatus: 403 });
    await page.goto("/app/goatfarms/20/ownership-transfers");
    await expect(page.locator(".ownership-transfer-status", { hasText: "Solicitada" })).toBeVisible();
    page.once("dialog", (browserDialog) => browserDialog.accept());
    await page.getByRole("button", { name: "Aceitar" }).click();
    await expect(page.locator(".ownership-transfer-status", { hasText: "Solicitada" })).toBeVisible();
    expect(state.status).toBe("REQUESTED");
  });

  test("does not query transfers when farm administration capability is denied", async ({ page }) => {
    const state = await setupApi(page, { permissionAllowed: false });
    await page.goto("/app/goatfarms/10/ownership-transfers");
    await expect(page).toHaveURL(/\/403$/);
    expect(state.transferListCalls).toBe(0);
  });
});

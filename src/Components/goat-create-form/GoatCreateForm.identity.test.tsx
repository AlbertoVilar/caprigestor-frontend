// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import GoatCreateForm from "./GoatCreateForm";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../../services/auth-service", () => ({
  getCurrentUser: () => ({ id: 7 }),
}));

vi.mock("../../api/GoatAPI/goat", () => ({
  createGoat: vi.fn(),
  updateGoat: vi.fn(),
}));

vi.mock("../../api/GenealogyAPI/genealogy", () => ({
  createGenealogy: vi.fn(),
}));

const goat: GoatResponseDTO = {
  technicalId: 99,
  id: 99,
  registrationNumber: "1643226001",
  name: "Matriz de teste",
  breed: "SAANEN",
  color: "Branca",
  gender: "Fêmea",
  birthDate: "2025-01-07",
  status: "Ativo",
  category: "PO",
  tod: "16432",
  toe: "26001",
  farmId: 42,
  userId: 7,
};

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("GoatCreateForm registration identity", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    container?.remove();
  });

  it("keeps registration number, TOD and TOE read-only while editing", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        <GoatCreateForm
          mode="edit"
          initialData={goat}
          onGoatCreated={() => {}}
        />
      );
    });

    expect((container.querySelector('input[name="registrationNumber"]') as HTMLInputElement).readOnly).toBe(true);
    expect((container.querySelector('input[name="tod"]') as HTMLInputElement).readOnly).toBe(true);
    expect((container.querySelector('input[name="toe"]') as HTMLInputElement).readOnly).toBe(true);
    expect(container.textContent).toContain("A identidade registral é alterada somente pela operação de retificação.");
  });
});


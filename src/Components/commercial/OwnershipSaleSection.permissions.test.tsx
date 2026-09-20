import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import OwnershipSaleSection from "./OwnershipSaleSection";

vi.mock("../../api/CommercialAPI/commercial", () => ({
  acceptOwnershipSale: vi.fn(),
  cancelOwnershipSale: vi.fn(),
  listIncomingOwnershipSales: vi.fn(),
  listOutgoingOwnershipSales: vi.fn(),
  rejectOwnershipSale: vi.fn(),
  registerOwnershipSalePayment: vi.fn(),
  requestOwnershipSale: vi.fn(),
}));

vi.mock("react-toastify", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

const goats = [{ id: 42, technicalId: 42, registrationNumber: "RG-42", name: "Zenda", status: "ATIVO" }] as never[];
const customers = [{ id: 7, name: "Buyer", active: true }] as never[];

describe("OwnershipSaleSection mutation capability", () => {
  it("renders request controls for an owner/admin", () => {
    const html = renderToStaticMarkup(
      <OwnershipSaleSection farmId={1} goats={goats} customers={customers} canAdministerFarm onChanged={() => {}} />
    );
    expect(html).toContain("Solicitar venda com transferência");
    expect(html).not.toContain("Apenas administradores da fazenda");
  });

  it("keeps the read surface but hides mutation controls for an operator", () => {
    const html = renderToStaticMarkup(
      <OwnershipSaleSection farmId={1} goats={goats} customers={customers} canAdministerFarm={false} onChanged={() => {}} />
    );
    expect(html).not.toContain("Solicitar venda com transferência");
    expect(html).toContain("Apenas administradores da fazenda");
  });
});

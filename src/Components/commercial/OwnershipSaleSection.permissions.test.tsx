import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  canCancelOwnershipSale,
  canRejectOwnershipSale,
  loadOwnershipSaleReads,
  selectDestinationFarms,
} from "./OwnershipSaleSection";
import OwnershipSaleSection from "./OwnershipSaleSection";
import { listIncomingOwnershipSales, listOutgoingOwnershipSales } from "../../api/CommercialAPI/commercial";
import { getAllFarms } from "../../api/GoatFarmAPI/goatFarm";

vi.mock("../../api/CommercialAPI/commercial", () => ({
  acceptOwnershipSale: vi.fn(),
  cancelOwnershipSale: vi.fn(),
  listIncomingOwnershipSales: vi.fn(),
  listOutgoingOwnershipSales: vi.fn(),
  rejectOwnershipSale: vi.fn(),
  registerOwnershipSalePayment: vi.fn(),
  requestOwnershipSale: vi.fn(),
}));

vi.mock("../../api/GoatFarmAPI/goatFarm", () => ({ getAllFarms: vi.fn() }));

vi.mock("react-toastify", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

const goats = [{ id: 42, technicalId: 42, registrationNumber: "RG-42", name: "Zenda", status: "ATIVO" }] as never[];
const customers = [{ id: 7, name: "Buyer", active: true }] as never[];

describe("OwnershipSaleSection mutation capability", () => {
  it("loads two eligible destinations and excludes the source farm", () => {
    const farms = [
      { id: 19, name: "Capril Bocaina", tod: "14008" },
      { id: 1, name: "Capril Vilar", tod: "16432" },
      { id: 14, name: "Capril Alto Paraíso", tod: "16153" },
    ] as never[];

    expect(selectDestinationFarms(farms, 19)).toEqual([
      expect.objectContaining({ id: 1, name: "Capril Vilar", tod: "16432" }),
      expect.objectContaining({ id: 14, name: "Capril Alto Paraíso", tod: "16153" }),
    ]);
  });

  it("keeps the farm catalog when incoming history fails", async () => {
    vi.mocked(listIncomingOwnershipSales).mockRejectedValueOnce(new Error("incoming unavailable"));
    vi.mocked(listOutgoingOwnershipSales).mockResolvedValueOnce([]);
    vi.mocked(getAllFarms).mockResolvedValueOnce([
      { id: 19, name: "Capril Bocaina", tod: "14008" },
      { id: 1, name: "Capril Vilar", tod: "16432" },
    ] as never);

    const result = await loadOwnershipSaleReads(19);

    expect(result.incoming).toBeUndefined();
    expect(result.farms).toHaveLength(2);
    expect(result.errors.incoming).toBeInstanceOf(Error);
  });

  it("keeps the farm catalog when outgoing history fails", async () => {
    vi.mocked(listIncomingOwnershipSales).mockResolvedValueOnce([]);
    vi.mocked(listOutgoingOwnershipSales).mockRejectedValueOnce(new Error("outgoing unavailable"));
    vi.mocked(getAllFarms).mockResolvedValueOnce([
      { id: 19, name: "Capril Bocaina", tod: "14008" },
      { id: 14, name: "Capril Alto Paraíso", tod: "16153" },
    ] as never);

    const result = await loadOwnershipSaleReads(19);

    expect(result.incoming).toEqual([]);
    expect(result.outgoing).toBeUndefined();
    expect(result.farms).toHaveLength(2);
    expect(result.errors.outgoing).toBeInstanceOf(Error);
  });

  it("preserves successful history when the farm catalog fails", async () => {
    const incoming = [{ saleId: 7, goatName: "Zenda" }] as never[];
    vi.mocked(listIncomingOwnershipSales).mockResolvedValueOnce(incoming);
    vi.mocked(listOutgoingOwnershipSales).mockResolvedValueOnce([]);
    vi.mocked(getAllFarms).mockRejectedValueOnce(new Error("farm catalog unavailable"));

    const result = await loadOwnershipSaleReads(19);

    expect(result.incoming).toEqual(incoming);
    expect(result.outgoing).toEqual([]);
    expect(result.farms).toBeUndefined();
    expect(result.errors.farms).toBeInstanceOf(Error);
  });

  it("hides reject and cancel after payment-first", () => {
    const paidRequested = { ownershipTransferStatus: "REQUESTED", paymentStatus: "PAID" } as never;
    expect(canRejectOwnershipSale(paidRequested)).toBe(false);
    expect(canCancelOwnershipSale(paidRequested)).toBe(false);
    expect(canRejectOwnershipSale({ ownershipTransferStatus: "REQUESTED", paymentStatus: "OPEN" } as never)).toBe(false);
    expect(canCancelOwnershipSale({ ownershipTransferStatus: "REQUESTED", paymentStatus: "OPEN" } as never)).toBe(true);
  });
  it("renders request controls for an owner/admin", () => {
    const html = renderToStaticMarkup(
      <OwnershipSaleSection farmId={1} goats={goats} customers={customers} canAdministerFarm onChanged={() => {}} />
    );
    expect(html).toContain("Registrar venda entre fazendas");
    expect(html).toContain("Fazenda destino");
    expect(html).toContain("Pagamento no ato (opcional)");
    expect(html).not.toContain("Chave de idempotência");
    expect(html).not.toContain("Cliente");
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

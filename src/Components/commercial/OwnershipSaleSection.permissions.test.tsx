import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  canCancelOwnershipSale,
  canRejectOwnershipSale,
  loadOwnershipSaleReads,
  ownershipSalePaymentAction,
  ownershipSalePaymentDate,
  ownershipSaleStatusLabel,
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
const sale = (overrides: Record<string, unknown> = {}) => ({
  saleId: 91,
  sourceFarmId: 19,
  targetFarmId: 1,
  goatTechnicalId: 81,
  goatRegistrationNumber: "1400826002",
  goatName: "Nasc Macho QA da Bocaina",
  saleDate: "2026-09-22",
  amount: 2500,
  dueDate: "2026-09-22",
  paymentStatus: "OPEN",
  paymentDate: null,
  ownershipTransferId: 8,
  ownershipTransferStatus: "REQUESTED",
  ...overrides,
}) as never;

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

  it.each([
    [sale({ paymentStatus: "PAID", ownershipTransferStatus: "REQUESTED" }), "Pago — transferência pendente"],
    [sale({ paymentStatus: "PAID", ownershipTransferStatus: "ACCEPTED" }), "Pago — transferência pendente"],
    [sale({ paymentStatus: "OPEN", ownershipTransferStatus: "REQUESTED" }), "Aguardando pagamento do vendedor"],
    [sale({ paymentStatus: "OPEN", ownershipTransferStatus: "ACCEPTED" }), "Aguardando pagamento do vendedor"],
    [sale({ paymentStatus: "PAID", ownershipTransferStatus: "COMPLETED" }), "Concluída"],
    [sale({ paymentStatus: "OPEN", ownershipTransferStatus: "CANCELLED" }), "Cancelada"],
    [sale({ paymentStatus: "OPEN", ownershipTransferStatus: "REJECTED" }), "Rejeitada"],
  ])("uses ownership status as the authoritative label: %s", (value, expected) => {
    expect(ownershipSaleStatusLabel(value)).toBe(expected);
    expect(ownershipSaleStatusLabel(value)).not.toContain("transferência concluída");
  });

  it("keeps seller payment available for REQUESTED and legacy ACCEPTED unpaid sales", () => {
    expect(ownershipSalePaymentAction(sale({ paymentStatus: "OPEN", ownershipTransferStatus: "REQUESTED" }), true)).toBe("PAY");
    expect(ownershipSalePaymentAction(sale({ paymentStatus: "OPEN", ownershipTransferStatus: "ACCEPTED" }), true)).toBe("PAY");
    expect(ownershipSalePaymentAction(sale({ paymentStatus: "OPEN", ownershipTransferStatus: "REQUESTED" }), false)).toBeNull();
  });

  it("exposes recovery only for paid pending transfers with a persisted payment date", () => {
    const requested = sale({ paymentStatus: "PAID", ownershipTransferStatus: "REQUESTED", paymentDate: "2026-09-22" });
    const accepted = sale({ paymentStatus: "PAID", ownershipTransferStatus: "ACCEPTED", paymentDate: [2026, 9, 22] });
    expect(ownershipSalePaymentAction(requested, true)).toBe("RECOVER");
    expect(ownershipSalePaymentAction(accepted, true)).toBe("RECOVER");
    expect(ownershipSalePaymentDate(requested, "2026-09-23")).toBe("2026-09-22");
    expect(ownershipSalePaymentDate(accepted, "2026-09-23")).toBe("2026-09-22");
  });

  it("does not fabricate a payment date for paid pending transfers without one", () => {
    const inconsistent = sale({ paymentStatus: "PAID", ownershipTransferStatus: "REQUESTED", paymentDate: null });
    expect(ownershipSalePaymentAction(inconsistent, true)).toBe("UNAVAILABLE");
    expect(ownershipSalePaymentDate(inconsistent, "2026-09-23")).toBe("2026-09-23");
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

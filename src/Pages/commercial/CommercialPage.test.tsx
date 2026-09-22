import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import CommercialPage from "./CommercialPage";
import CommercialTabs from "../../Components/commercial/CommercialTabs";
import AnimalSalesTab from "../../Components/commercial/AnimalSalesTab";
import MilkSalesTab from "../../Components/commercial/MilkSalesTab";
import CustomersTab from "../../Components/commercial/CustomersTab";
import CommercialFinanceTab from "../../Components/commercial/CommercialFinanceTab";
import {
  COMMERCIAL_TAB_CONFIG,
  parseCommercialTab,
  VALID_COMMERCIAL_TABS,
} from "./commercial.helpers";
import {
  canCancelOwnershipSale,
  canRejectOwnershipSale,
  ownershipSalePaymentAction,
  ownershipSaleStatusLabel,
} from "../../Components/commercial/OwnershipSaleSection";
import type { OwnershipSaleResponseDTO } from "../../Models/CommercialDTOs";

let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>{children}</a>
  ),
  useParams: () => ({ farmId: "19" }),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

vi.mock("../../Hooks/useFarmPermissions", () => ({
  useFarmPermissions: () => ({
    canAdministerFarm: true,
    loading: false,
  }),
}));

vi.mock("../../api/CommercialAPI/commercial", () => ({
  createAnimalSale: vi.fn(),
  createCustomer: vi.fn(),
  createMilkSale: vi.fn(),
  fetchCommercialSummary: vi.fn().mockResolvedValue({
    customerCount: 3,
    animalSalesCount: 2,
    animalSalesTotal: 2500,
    milkSalesCount: 5,
    milkSalesQuantityLiters: 150,
    milkSalesTotal: 675,
    openReceivablesCount: 2,
    openReceivablesTotal: 400,
    paidReceivablesCount: 4,
    paidReceivablesTotal: 2775,
  }),
  fetchMonthlyOperationalSummary: vi.fn().mockResolvedValue({
    year: 2026,
    month: 9,
    totalRevenue: 3000,
    totalExpenses: 1200,
    balance: 1800,
    animalSalesRevenue: 2500,
    milkSalesRevenue: 500,
    operationalExpensesTotal: 1200,
    inventoryPurchaseCostsTotal: 0,
  }),
  listAnimalSales: vi.fn().mockResolvedValue([]),
  listCustomers: vi.fn().mockResolvedValue([]),
  listMilkSales: vi.fn().mockResolvedValue([]),
  listReceivables: vi.fn().mockResolvedValue([]),
  listOperationalExpenses: vi.fn().mockResolvedValue([]),
  listIncomingOwnershipSales: vi.fn().mockResolvedValue([]),
  listOutgoingOwnershipSales: vi.fn().mockResolvedValue([]),
  registerAnimalSalePayment: vi.fn(),
  registerMilkSalePayment: vi.fn(),
  requestOwnershipSale: vi.fn(),
  registerOwnershipSalePayment: vi.fn(),
  cancelOwnershipSale: vi.fn(),
}));

vi.mock("../../api/GoatFarmAPI/goatFarm", () => ({
  getGoatFarmById: vi.fn().mockResolvedValue({ id: 19, name: "Capril da Bocaina", tod: "14008" }),
  getAllFarms: vi.fn().mockResolvedValue([
    { id: 19, name: "Capril da Bocaina", tod: "14008" },
    { id: 1, name: "Capril Vilar", tod: "16432" },
  ]),
}));

vi.mock("../../api/GoatAPI/goat", () => ({
  findGoatsByFarmIdPaginated: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
}));

vi.mock("../../api/AuditAPI/audit", () => ({
  listOperationalAuditEntries: vi.fn().mockResolvedValue([]),
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe("Commercial Workspace Architecture (W14.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("1. default commercial tab is Visão geral (overview)", () => {
    expect(parseCommercialTab(null)).toBe("overview");
    expect(parseCommercialTab("")).toBe("overview");
    expect(parseCommercialTab(undefined)).toBe("overview");

    const html = renderToStaticMarkup(<CommercialPage />);
    expect(html).toContain('id="commercial-tab-overview"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("Resumo mensal da fazenda");
    expect(html).toContain("Atalhos operacionais");
  });

  it("2. explicit tab query parameter opens correct context", () => {
    mockSearchParams = new URLSearchParams("tab=animals");
    const htmlAnimals = renderToStaticMarkup(<CommercialPage />);
    expect(htmlAnimals).toContain("Modelos de comercialização de animais");
    expect(htmlAnimals).toContain("Venda para cliente externo");
    expect(htmlAnimals).toContain("Venda patrimonial entre fazendas");

    mockSearchParams = new URLSearchParams("tab=milk");
    const htmlMilk = renderToStaticMarkup(<CommercialPage />);
    expect(htmlMilk).toContain("Comercialização recorrente");
    expect(htmlMilk).toContain("Vendas de leite");

    mockSearchParams = new URLSearchParams("tab=customers");
    const htmlCustomers = renderToStaticMarkup(<CommercialPage />);
    expect(htmlCustomers).toContain("Cadastro de compradores");
    expect(htmlCustomers).toContain("Diretório de clientes");

    mockSearchParams = new URLSearchParams("tab=finance");
    const htmlFinance = renderToStaticMarkup(<CommercialPage />);
    expect(htmlFinance).toContain("Recebiveis operacionais");
    expect(htmlFinance).toContain("Despesas da fazenda");
    expect(htmlFinance).toContain("Auditabilidade comercial");
  });

  it("3. invalid tab falls back safely to overview", () => {
    expect(parseCommercialTab("unknown-tab")).toBe("overview");
    expect(parseCommercialTab("hacked_tab")).toBe("overview");

    mockSearchParams = new URLSearchParams("tab=invalid_value");
    const html = renderToStaticMarkup(<CommercialPage />);
    expect(html).toContain('id="commercial-tab-overview"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("Atalhos operacionais");
  });

  it("4. user can navigate among all five contexts", () => {
    expect(VALID_COMMERCIAL_TABS).toEqual([
      "overview",
      "animals",
      "milk",
      "customers",
      "finance",
    ]);

    const selectTabSpy = vi.fn();
    const html = renderToStaticMarkup(
      <CommercialTabs activeTab="overview" onSelectTab={selectTabSpy} />
    );

    expect(html).toContain("Visão geral");
    expect(html).toContain("Animais");
    expect(html).toContain("Leite");
    expect(html).toContain("Clientes");
    expect(html).toContain("Financeiro");
  });

  it("5. tab navigation is keyboard/focus accessible", () => {
    const html = renderToStaticMarkup(
      <CommercialTabs
        activeTab="animals"
        onSelectTab={vi.fn()}
        badges={{ animals: 3, finance: "1 em atraso" }}
      />
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Navegação da Gestão Comercial"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('id="commercial-tab-animals"');
    expect(html).toContain('aria-controls="commercial-tabpanel-animals"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('id="commercial-tab-overview"');
    expect(html).toContain('aria-selected="false"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain("commercial-tab-badge");
  });

  it("6. existing customer creation flow remains wired", () => {
    const handleCreateCustomer = vi.fn();
    const setCustomerForm = vi.fn();
    const html = renderToStaticMarkup(
      <CustomersTab
        customers={[{ id: 1, name: "Comprador Queijos", active: true, phone: "1199999", email: "q@q.com" }]}
        customerForm={{ name: "Novo Comprador", document: "123", phone: "999", email: "a@b.com", notes: "" }}
        setCustomerForm={setCustomerForm}
        handleCreateCustomer={handleCreateCustomer}
        submitting={null}
      />
    );

    expect(html).toContain("Novo cliente");
    expect(html).toContain("Cadastrar cliente");
    expect(html).toContain("Comprador Queijos");
    expect(html).toContain("Ativo");
  });

  it("7. external animal-sale creation remains wired with explicit external sale model", () => {
    const html = renderToStaticMarkup(
      <AnimalSalesTab
        farmId={19}
        goats={[{ id: 80, technicalId: 80, registrationNumber: "RG-80", name: "Cabrita 80", status: "ATIVO" }]}
        customers={[{ id: 1, name: "Comprador Silva", active: true }]}
        activeCustomers={[{ id: 1, name: "Comprador Silva", active: true }]}
        animalSales={[]}
        animalSaleForm={{
          goatId: "RG-80",
          customerId: 1,
          saleDate: "2026-09-22",
          amount: 1500,
          dueDate: "2026-09-30",
          paymentDate: "",
          notes: "",
        }}
        setAnimalSaleForm={vi.fn()}
        handleCreateAnimalSale={vi.fn()}
        exportAnimalSalesCsv={vi.fn()}
        submitting={null}
        animalSaleTotalPreview="R$ 1.500,00"
        canAdministerFarm={true}
        onOwnershipSaleChanged={vi.fn()}
        today="2026-09-22"
      />
    );

    expect(html).toContain("Venda para cliente externo");
    expect(html).toContain("Registrar venda do animal");
    expect(html).toContain("RG-80 · Cabrita 80 · ATIVO");
    expect(html).toContain("Comprador Silva");
    expect(html).toContain("R$ 1.500,00");
  });

  it("8. milk-sale creation remains wired", () => {
    const html = renderToStaticMarkup(
      <MilkSalesTab
        activeCustomers={[{ id: 2, name: "Laticínio Central", active: true }]}
        milkSales={[]}
        milkSaleForm={{
          customerId: 2,
          saleDate: "2026-09-22",
          quantityLiters: 100,
          unitPrice: 4.5,
          dueDate: "2026-09-30",
          paymentDate: "",
          notes: "",
        }}
        setMilkSaleForm={vi.fn()}
        handleCreateMilkSale={vi.fn()}
        exportMilkSalesCsv={vi.fn()}
        submitting={null}
        milkSaleTotalPreview="R$ 450,00"
        today="2026-09-22"
      />
    );

    expect(html).toContain("Venda de leite");
    expect(html).toContain("Quantidade (L)");
    expect(html).toContain("Preço unitário");
    expect(html).toContain("Registrar venda de leite");
    expect(html).toContain("Laticínio Central");
    expect(html).toContain("R$ 450,00");
  });

  it("9. OwnershipSaleSection remains present under Animais", () => {
    mockSearchParams = new URLSearchParams("tab=animals");
    const html = renderToStaticMarkup(<CommercialPage />);
    expect(html).toContain("Venda patrimonial entre fazendas");
    expect(html).toContain("Vender para outra fazenda");
    expect(html).toContain("Histórico de aquisições");
    expect(html).toContain("Vendas enviadas");
  });

  it("10. INTERNAL_SALE canonical status behavior remains unchanged", () => {
    const completedSale: OwnershipSaleResponseDTO = {
      saleId: 1,
      sourceFarmId: 19,
      targetFarmId: 1,
      goatTechnicalId: 80,
      goatRegistrationNumber: "RG-80",
      goatName: "Cabrita 80",
      saleDate: "2026-09-20",
      amount: 2000,
      dueDate: "2026-09-25",
      paymentStatus: "PAID",
      paymentDate: "2026-09-21",
      ownershipTransferId: 10,
      ownershipTransferStatus: "COMPLETED",
    };
    expect(ownershipSaleStatusLabel(completedSale)).toBe("Concluída");

    const cancelledSale = { ...completedSale, ownershipTransferStatus: "CANCELLED" as const };
    expect(ownershipSaleStatusLabel(cancelledSale)).toBe("Cancelada");

    const rejectedSale = { ...completedSale, ownershipTransferStatus: "REJECTED" as const };
    expect(ownershipSaleStatusLabel(rejectedSale)).toBe("Rejeitada");

    const paidPending = { ...completedSale, ownershipTransferStatus: "REQUESTED" as const, paymentStatus: "PAID" as const };
    expect(ownershipSaleStatusLabel(paidPending)).toBe("Pago — transferência pendente");

    const openPending = { ...completedSale, ownershipTransferStatus: "REQUESTED" as const, paymentStatus: "OPEN" as const };
    expect(ownershipSaleStatusLabel(openPending)).toBe("Aguardando pagamento do vendedor");
  });

  it("11. buyer accept/reject actions do not reappear", () => {
    const sale: OwnershipSaleResponseDTO = {
      saleId: 1,
      sourceFarmId: 19,
      targetFarmId: 1,
      goatTechnicalId: 80,
      goatRegistrationNumber: "RG-80",
      goatName: "Cabrita 80",
      saleDate: "2026-09-20",
      amount: 2000,
      dueDate: "2026-09-25",
      paymentStatus: "OPEN",
      paymentDate: null,
      ownershipTransferId: 10,
      ownershipTransferStatus: "REQUESTED",
    };

    expect(canRejectOwnershipSale(sale)).toBe(false);
    expect(canCancelOwnershipSale(sale)).toBe(true);
    const html = renderToStaticMarkup(
      <AnimalSalesTab
        farmId={19}
        goats={[]}
        customers={[]}
        activeCustomers={[]}
        animalSales={[]}
        animalSaleForm={{
          goatId: "",
          customerId: 0,
          saleDate: "2026-09-22",
          amount: 0,
          dueDate: "2026-09-22",
          paymentDate: "",
          notes: "",
        }}
        setAnimalSaleForm={vi.fn()}
        handleCreateAnimalSale={vi.fn()}
        exportAnimalSalesCsv={vi.fn()}
        submitting={null}
        animalSaleTotalPreview="R$ 0,00"
        canAdministerFarm={true}
        onOwnershipSaleChanged={vi.fn()}
        today="2026-09-22"
      />
    );
    expect(html).not.toContain("Aceitar transferência");
    expect(html).not.toContain("Rejeitar transferência");
  });

  it("12. Financeiro still exposes current receivable functionality and inline payment", () => {
    const handleRegisterPayment = vi.fn();
    const setPaymentDrafts = vi.fn();
    const html = renderToStaticMarkup(
      <CommercialFinanceTab
        farmId={19}
        receivables={[
          {
            sourceType: "ANIMAL_SALE",
            sourceId: 5,
            sourceLabel: "Venda RG-80",
            customerId: 1,
            customerName: "Comprador Santos",
            amount: 1200,
            dueDate: "2026-09-15",
            paymentStatus: "OPEN",
            paymentDate: null,
            notes: null,
          },
        ]}
        exportReceivablesCsv={vi.fn()}
        paymentDrafts={{ "ANIMAL_SALE-5": "2026-09-22" }}
        setPaymentDrafts={setPaymentDrafts}
        paymentSubmittingKey={null}
        handleRegisterPayment={handleRegisterPayment}
        onExpenseChanged={vi.fn()}
        auditEntries={[]}
        formatAuditDateTime={() => "22/09/2026 10:00"}
        today="2026-09-22"
      />
    );

    expect(html).toContain("Acompanhar recebimentos");
    expect(html).toContain("Comprador Santos");
    expect(html).toContain("R$ 1.200,00");
    expect(html).toContain("Marcar pago");
    expect(html).toContain("Em atraso");
    expect(html).toContain("Despesas da fazenda");
    expect(html).toContain("Operações críticas recentes");
  });

  it("13. permission-restricted actions remain hidden/disabled when not authorized", () => {
    const pendingSale: OwnershipSaleResponseDTO = {
      saleId: 1,
      sourceFarmId: 19,
      targetFarmId: 1,
      goatTechnicalId: 80,
      goatRegistrationNumber: "RG-80",
      goatName: "Cabrita 80",
      saleDate: "2026-09-20",
      amount: 2000,
      dueDate: "2026-09-25",
      paymentStatus: "OPEN",
      paymentDate: null,
      ownershipTransferId: 10,
      ownershipTransferStatus: "REQUESTED",
    };

    expect(ownershipSalePaymentAction(pendingSale, false)).toBeNull();
    expect(ownershipSalePaymentAction(pendingSale, true)).toBe("PAY");
  });

  it("14. mobile/narrow viewport does not make core tab navigation inaccessible", () => {
    const html = renderToStaticMarkup(
      <CommercialTabs activeTab="overview" onSelectTab={vi.fn()} />
    );

    expect(html).toContain("commercial-tabs-wrapper");
    expect(html).toContain("commercial-tabs-nav");
    COMMERCIAL_TAB_CONFIG.forEach((tab) => {
      expect(html).toContain(`id="commercial-tab-${tab.key}"`);
      expect(html).toContain(tab.label);
    });
  });
});

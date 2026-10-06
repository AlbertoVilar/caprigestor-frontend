import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import AnimalSalesTab from "../../Components/commercial/AnimalSalesTab";
import CommercialFinanceTab from "../../Components/commercial/CommercialFinanceTab";
import CommercialOverviewTab from "../../Components/commercial/CommercialOverviewTab";
import CommercialTabs from "../../Components/commercial/CommercialTabs";
import CustomersTab from "../../Components/commercial/CustomersTab";
import MilkSalesTab from "../../Components/commercial/MilkSalesTab";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import { listOperationalAuditEntries } from "../../api/AuditAPI/audit";
import {
  createAnimalSale,
  createCustomer,
  createMilkSale,
  fetchCommercialSummary,
  listAnimalSales,
  listCustomers,
  listMilkSales,
  listReceivables,
  registerAnimalSalePayment,
  registerMilkSalePayment,
} from "../../api/CommercialAPI/commercial";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import { findGoatsByFarmIdPaginated } from "../../api/GoatAPI/goat";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import type {
  AnimalSaleRequestDTO,
  AnimalSaleResponseDTO,
  CommercialSummaryDTO,
  CustomerRequestDTO,
  CustomerResponseDTO,
  MilkSaleRequestDTO,
  MilkSaleResponseDTO,
  ReceivableResponseDTO,
} from "../../Models/CommercialDTOs";
import type { OperationalAuditEntryDTO } from "../../Models/OperationalAuditDTOs";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import {
  buildFarmDashboardPath,
  buildFarmInventoryPath,
  buildFarmWorkspaceGoatsPath,
} from "../../utils/appRoutes";
import { todayInSaoPaulo } from "../../utils/civilDate";
import {
  buildCommercialCsvContent,
  buildCommercialSummaryCards,
  formatCommercialCurrency,
  formatCommercialDate,
  formatCommercialNumber,
  formatPaymentStatusLabel,
  formatReceivableStatusLabel,
  isOverdueReceivable,
  parseCommercialTab,
  type CommercialTabKey,
} from "./commercial.helpers";
import "./commercialPage.css";

const today = todayInSaoPaulo();

const emptySummary: CommercialSummaryDTO = {
  customerCount: 0,
  animalSalesCount: 0,
  animalSalesTotal: 0,
  milkSalesCount: 0,
  milkSalesQuantityLiters: 0,
  milkSalesTotal: 0,
  openReceivablesCount: 0,
  openReceivablesTotal: 0,
  paidReceivablesCount: 0,
  paidReceivablesTotal: 0,
};

export default function CommercialPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const farmIdNumber = useMemo(() => (farmId ? Number(farmId) : NaN), [farmId]);
  const { canAdministerFarm } = useFarmPermissions(farmIdNumber);

  const activeTab = useMemo(
    () => parseCommercialTab(searchParams.get("tab")),
    [searchParams]
  );

  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [goats, setGoats] = useState<GoatResponseDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([]);
  const [animalSales, setAnimalSales] = useState<AnimalSaleResponseDTO[]>([]);
  const [milkSales, setMilkSales] = useState<MilkSaleResponseDTO[]>([]);
  const [receivables, setReceivables] = useState<ReceivableResponseDTO[]>([]);
  const [auditEntries, setAuditEntries] = useState<OperationalAuditEntryDTO[]>([]);
  const [summary, setSummary] = useState<CommercialSummaryDTO>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [submitting, setSubmitting] = useState<"customer" | "animalSale" | "milkSale" | null>(null);
  const [paymentSubmittingKey, setPaymentSubmittingKey] = useState<string | null>(null);
  const [financeReloadToken, setFinanceReloadToken] = useState(0);

  const [customerForm, setCustomerForm] = useState<CustomerRequestDTO>({
    name: "",
    document: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [animalSaleForm, setAnimalSaleForm] = useState<AnimalSaleRequestDTO>({
    goatId: "",
    customerId: 0,
    saleDate: today,
    amount: 0,
    dueDate: today,
    paymentDate: "",
    notes: "",
  });
  const [milkSaleForm, setMilkSaleForm] = useState<MilkSaleRequestDTO>({
    customerId: 0,
    saleDate: today,
    quantityLiters: 0,
    unitPrice: 0,
    dueDate: today,
    paymentDate: "",
    notes: "",
  });
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, string>>({});

  const dashboardPath = Number.isNaN(farmIdNumber) ? "/goatfarms" : buildFarmDashboardPath(farmIdNumber);
  const herdPath = Number.isNaN(farmIdNumber)
    ? "/goatfarms"
    : buildFarmWorkspaceGoatsPath(farmIdNumber);
  const inventoryPath = Number.isNaN(farmIdNumber) ? "/goatfarms" : buildFarmInventoryPath(farmIdNumber);
  const summaryCards = useMemo(() => buildCommercialSummaryCards(summary), [summary]);
  const activeCustomers = useMemo(() => customers.filter((customer) => customer.active), [customers]);
  const overdueReceivables = useMemo(
    () => receivables.filter((receivable) => isOverdueReceivable(receivable, today)),
    [receivables]
  );
  const animalSaleTotalPreview = useMemo(
    () => formatCommercialCurrency(animalSaleForm.amount || 0),
    [animalSaleForm.amount]
  );
  const milkSaleTotalPreview = useMemo(
    () => formatCommercialCurrency((milkSaleForm.quantityLiters || 0) * (milkSaleForm.unitPrice || 0)),
    [milkSaleForm.quantityLiters, milkSaleForm.unitPrice]
  );
  const formatAuditDateTime = useCallback(
    (value?: string | null) => (value ? new Date(value).toLocaleString("pt-BR") : "-"),
    []
  );

  const handleSelectTab = useCallback(
    (tab: CommercialTabKey) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev.toString());
        next.set("tab", tab);
        return next;
      });
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (activeCustomers.length === 0) return;

    setAnimalSaleForm((prev) => ({
      ...prev,
      customerId: prev.customerId || activeCustomers[0].id,
    }));
    setMilkSaleForm((prev) => ({
      ...prev,
      customerId: prev.customerId || activeCustomers[0].id,
    }));
  }, [activeCustomers]);

  useEffect(() => {
    if (goats.length === 0) return;

    const defaultGoat = goats.find((goat) => String(goat.status).toUpperCase() === "ATIVO") ?? goats[0];
    setAnimalSaleForm((prev) => ({
      ...prev,
      goatId: prev.goatId || defaultGoat.registrationNumber,
    }));
  }, [goats]);

  const loadCommercialData = useCallback(async () => {
    if (Number.isNaN(farmIdNumber)) return;

    setLoading(true);
    setPageError("");

    try {
      const [farm, goatPage, summaryData, customersData, animalSalesData, milkSalesData, receivablesData, auditEntriesData] =
        await Promise.all([
          getGoatFarmById(farmIdNumber),
          findGoatsByFarmIdPaginated(farmIdNumber, 0, 100),
          fetchCommercialSummary(farmIdNumber),
          listCustomers(farmIdNumber),
          listAnimalSales(farmIdNumber),
          listMilkSales(farmIdNumber),
          listReceivables(farmIdNumber),
          listOperationalAuditEntries(farmIdNumber, { limit: 12 }),
        ]);

      setFarmData(farm);
      setGoats(goatPage.content ?? []);
      setSummary(summaryData);
      setCustomers(customersData);
      setAnimalSales(animalSalesData);
      setMilkSales(milkSalesData);
      setReceivables(receivablesData);
      setAuditEntries(auditEntriesData);
      setPaymentDrafts(
        Object.fromEntries(receivablesData.map((item) => [`${item.sourceType}-${item.sourceId}`, today]))
      );
    } catch (error) {
      console.error("Comercial: erro ao carregar dados", error);
      setPageError("Não foi possível carregar a camada comercial desta fazenda.");
    } finally {
      setLoading(false);
    }
  }, [farmIdNumber]);

  useEffect(() => {
    if (Number.isNaN(farmIdNumber)) return;
    void loadCommercialData();
  }, [farmIdNumber, loadCommercialData]);

  function downloadCsv(fileName: string, content: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  function exportAnimalSalesCsv() {
    downloadCsv(
      `vendas-animais-fazenda-${farmIdNumber}.csv`,
      buildCommercialCsvContent(
        ["Animal", "Nome", "Cliente", "Data da venda", "Valor", "Vencimento", "Status", "Pagamento", "Reversão"],
        animalSales.map((sale) => [
          sale.goatRegistrationNumber,
          sale.goatName,
          sale.customerName,
          formatCommercialDate(sale.saleDate),
          formatCommercialCurrency(sale.amount),
          formatCommercialDate(sale.dueDate),
          sale.reversed ? "Revertida" : formatPaymentStatusLabel(sale.paymentStatus),
          formatCommercialDate(sale.paymentDate),
          sale.reversed
            ? `${sale.reversalReason || "Sem motivo informado"}${
                sale.reversedAt ? ` em ${formatCommercialDate(sale.reversedAt)}` : ""
              }`
            : "-",
        ])
      )
    );
  }

  function exportMilkSalesCsv() {
    downloadCsv(
      `vendas-leite-fazenda-${farmIdNumber}.csv`,
      buildCommercialCsvContent(
        ["Cliente", "Data da venda", "Quantidade (L)", "Preco unitario", "Total", "Vencimento", "Status", "Pagamento"],
        milkSales.map((sale) => [
          sale.customerName,
          formatCommercialDate(sale.saleDate),
          formatCommercialNumber(sale.quantityLiters),
          formatCommercialCurrency(sale.unitPrice),
          formatCommercialCurrency(sale.totalAmount),
          formatCommercialDate(sale.dueDate),
          formatPaymentStatusLabel(sale.paymentStatus),
          formatCommercialDate(sale.paymentDate),
        ])
      )
    );
  }

  function exportReceivablesCsv() {
    downloadCsv(
      `recebiveis-fazenda-${farmIdNumber}.csv`,
      buildCommercialCsvContent(
        ["Origem", "Cliente", "Valor", "Vencimento", "Status", "Pagamento"],
        receivables.map((receivable) => [
          receivable.sourceLabel,
          receivable.customerName,
          formatCommercialCurrency(receivable.amount),
          formatCommercialDate(receivable.dueDate),
          formatReceivableStatusLabel(receivable, today),
          formatCommercialDate(receivable.paymentDate),
        ])
      )
    );
  }

  async function handleCreateCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Number.isNaN(farmIdNumber)) return;

    try {
      setSubmitting("customer");
      await createCustomer(farmIdNumber, {
        ...customerForm,
        name: customerForm.name.trim(),
        document: customerForm.document?.trim() || undefined,
        phone: customerForm.phone?.trim() || undefined,
        email: customerForm.email?.trim() || undefined,
        notes: customerForm.notes?.trim() || undefined,
      });
      toast.success("Cliente cadastrado com sucesso.");
      setCustomerForm({ name: "", document: "", phone: "", email: "", notes: "" });
      await loadCommercialData();
    } catch (error) {
      console.error("Comercial: erro ao criar cliente", error);
      toast.error("Não foi possível cadastrar o cliente.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateAnimalSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Number.isNaN(farmIdNumber)) return;

    try {
      setSubmitting("animalSale");
      await createAnimalSale(farmIdNumber, {
        ...animalSaleForm,
        paymentDate: animalSaleForm.paymentDate || undefined,
        notes: animalSaleForm.notes?.trim() || undefined,
      });
      toast.success("Venda de animal registrada com sucesso.");
      setAnimalSaleForm((prev) => ({ ...prev, amount: 0, paymentDate: "", notes: "" }));
      await loadCommercialData();
      setFinanceReloadToken((current) => current + 1);
    } catch (error) {
      console.error("Comercial: erro ao registrar venda de animal", error);
      toast.error("Não foi possível registrar a venda do animal.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateMilkSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Number.isNaN(farmIdNumber)) return;

    try {
      setSubmitting("milkSale");
      await createMilkSale(farmIdNumber, {
        ...milkSaleForm,
        paymentDate: milkSaleForm.paymentDate || undefined,
        notes: milkSaleForm.notes?.trim() || undefined,
      });
      toast.success("Venda de leite registrada com sucesso.");
      setMilkSaleForm((prev) => ({ ...prev, quantityLiters: 0, unitPrice: 0, paymentDate: "", notes: "" }));
      await loadCommercialData();
      setFinanceReloadToken((current) => current + 1);
    } catch (error) {
      console.error("Comercial: erro ao registrar venda de leite", error);
      toast.error("Não foi possível registrar a venda de leite.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleRegisterPayment(receivable: ReceivableResponseDTO) {
    if (Number.isNaN(farmIdNumber)) return;

    const paymentKey = `${receivable.sourceType}-${receivable.sourceId}`;
    const paymentDate = paymentDrafts[paymentKey] || today;

    try {
      setPaymentSubmittingKey(paymentKey);
      if (receivable.sourceType === "ANIMAL_SALE") {
        await registerAnimalSalePayment(farmIdNumber, receivable.sourceId, { paymentDate });
      } else {
        await registerMilkSalePayment(farmIdNumber, receivable.sourceId, { paymentDate });
      }
      toast.success("Recebimento registrado com sucesso.");
      await loadCommercialData();
      setFinanceReloadToken((current) => current + 1);
    } catch (error) {
      console.error("Comercial: erro ao marcar recebivel como pago", error);
      toast.error("Não foi possível registrar o recebimento.");
    } finally {
      setPaymentSubmittingKey(null);
    }
  }

  if (Number.isNaN(farmIdNumber)) {
    return (
      <div className="commercial-page commercial-page--centered">
        <div className="commercial-feedback commercial-feedback--error">
          <h1>Fazenda invalida</h1>
          <p>Não foi possível identificar a fazenda solicitada.</p>
          <button type="button" className="commercial-btn commercial-btn--secondary" onClick={() => navigate("/goatfarms")}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="commercial-page">
      <GoatFarmHeader name={farmData?.name || "Capril"} logoUrl={farmData?.logoUrl} />

      <section className="commercial-hero">
        <div className="commercial-hero__content">
          <div>
            <p className="commercial-hero__eyebrow">Comercial</p>
            <h1>Gestão comercial</h1>
            <p>Clientes, vendas e recebimentos da fazenda.</p>
          </div>
        </div>
        <div className="commercial-hero__actions">
          <Link to={dashboardPath} className="commercial-btn commercial-btn--secondary">
            Dashboard
          </Link>
          <Link to={inventoryPath} className="commercial-btn commercial-btn--secondary">
            Estoque
          </Link>
          <Link to={herdPath} className="commercial-btn commercial-btn--secondary">
            Rebanho
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="commercial-feedback">Carregando dados comerciais...</div>
      ) : pageError ? (
        <div className="commercial-feedback commercial-feedback--error">
          <p>{pageError}</p>
          <button type="button" className="commercial-btn commercial-btn--secondary" onClick={() => void loadCommercialData()}>
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          <CommercialTabs
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            badges={{
              animals: animalSales.length,
              milk: milkSales.length,
              customers: customers.length,
              finance: overdueReceivables.length > 0 ? `${overdueReceivables.length} em atraso` : undefined,
            }}
          />

          <div
            role="tabpanel"
            id={`commercial-tabpanel-${activeTab}`}
            aria-labelledby={`commercial-tab-${activeTab}`}
            className="commercial-tab-panel"
          >
            {activeTab === "overview" && (
              <CommercialOverviewTab
                farmId={farmIdNumber}
                summary={summary}
                summaryCards={summaryCards}
                overdueReceivablesCount={overdueReceivables.length}
                financeReloadToken={financeReloadToken}
                onSelectTab={handleSelectTab}
              />
            )}

            {activeTab === "animals" && (
              <AnimalSalesTab
                farmId={farmIdNumber}
                goats={goats}
                customers={customers}
                activeCustomers={activeCustomers}
                animalSales={animalSales}
                animalSaleForm={animalSaleForm}
                setAnimalSaleForm={setAnimalSaleForm}
                handleCreateAnimalSale={handleCreateAnimalSale}
                exportAnimalSalesCsv={exportAnimalSalesCsv}
                submitting={submitting}
                animalSaleTotalPreview={animalSaleTotalPreview}
                canAdministerFarm={canAdministerFarm}
                onOwnershipSaleChanged={() => {
                  void loadCommercialData();
                  setFinanceReloadToken((current) => current + 1);
                }}
                today={today}
              />
            )}

            {activeTab === "milk" && (
              <MilkSalesTab
                activeCustomers={activeCustomers}
                milkSales={milkSales}
                milkSaleForm={milkSaleForm}
                setMilkSaleForm={setMilkSaleForm}
                handleCreateMilkSale={handleCreateMilkSale}
                exportMilkSalesCsv={exportMilkSalesCsv}
                submitting={submitting}
                milkSaleTotalPreview={milkSaleTotalPreview}
                today={today}
              />
            )}

            {activeTab === "customers" && (
              <CustomersTab
                customers={customers}
                customerForm={customerForm}
                setCustomerForm={setCustomerForm}
                handleCreateCustomer={handleCreateCustomer}
                submitting={submitting}
              />
            )}

            {activeTab === "finance" && (
              <CommercialFinanceTab
                farmId={farmIdNumber}
                receivables={receivables}
                exportReceivablesCsv={exportReceivablesCsv}
                paymentDrafts={paymentDrafts}
                setPaymentDrafts={setPaymentDrafts}
                paymentSubmittingKey={paymentSubmittingKey}
                handleRegisterPayment={handleRegisterPayment}
                onExpenseChanged={() => setFinanceReloadToken((current) => current + 1)}
                auditEntries={auditEntries}
                formatAuditDateTime={formatAuditDateTime}
                today={today}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

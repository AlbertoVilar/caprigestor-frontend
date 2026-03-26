import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
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
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { buildFarmDashboardPath } from "../../utils/appRoutes";
import {
  buildCommercialSummaryCards,
  formatCommercialCurrency,
  formatCommercialDate,
  formatCommercialNumber,
  formatPaymentStatusLabel,
  isOpenReceivable,
} from "./commercial.helpers";
import "./commercialPage.css";

const today = new Date().toISOString().slice(0, 10);

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
  const farmIdNumber = useMemo(() => (farmId ? Number(farmId) : NaN), [farmId]);

  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [goats, setGoats] = useState<GoatResponseDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([]);
  const [animalSales, setAnimalSales] = useState<AnimalSaleResponseDTO[]>([]);
  const [milkSales, setMilkSales] = useState<MilkSaleResponseDTO[]>([]);
  const [receivables, setReceivables] = useState<ReceivableResponseDTO[]>([]);
  const [summary, setSummary] = useState<CommercialSummaryDTO>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [submitting, setSubmitting] = useState<"customer" | "animalSale" | "milkSale" | null>(null);
  const [paymentSubmittingKey, setPaymentSubmittingKey] = useState<string | null>(null);

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
  const summaryCards = useMemo(() => buildCommercialSummaryCards(summary), [summary]);
  const activeCustomers = useMemo(() => customers.filter((customer) => customer.active), [customers]);
  const animalSaleTotalPreview = useMemo(() => formatCommercialCurrency(animalSaleForm.amount || 0), [animalSaleForm.amount]);
  const milkSaleTotalPreview = useMemo(
    () => formatCommercialCurrency((milkSaleForm.quantityLiters || 0) * (milkSaleForm.unitPrice || 0)),
    [milkSaleForm.quantityLiters, milkSaleForm.unitPrice]
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
      const [farm, goatPage, summaryData, customersData, animalSalesData, milkSalesData, receivablesData] = await Promise.all([
        getGoatFarmById(farmIdNumber),
        findGoatsByFarmIdPaginated(farmIdNumber, 0, 100),
        fetchCommercialSummary(farmIdNumber),
        listCustomers(farmIdNumber),
        listAnimalSales(farmIdNumber),
        listMilkSales(farmIdNumber),
        listReceivables(farmIdNumber),
      ]);

      setFarmData(farm);
      setGoats(goatPage.content ?? []);
      setSummary(summaryData);
      setCustomers(customersData);
      setAnimalSales(animalSalesData);
      setMilkSales(milkSalesData);
      setReceivables(receivablesData);
      setPaymentDrafts(
        Object.fromEntries(receivablesData.map((item) => [`${item.sourceType}-${item.sourceId}`, today]))
      );
    } catch (error) {
      console.error("Comercial: erro ao carregar dados", error);
      setPageError("Nao foi possivel carregar a camada comercial desta fazenda.");
    } finally {
      setLoading(false);
    }
  }, [farmIdNumber]);

  useEffect(() => {
    if (Number.isNaN(farmIdNumber)) return;
    void loadCommercialData();
  }, [farmIdNumber, loadCommercialData]);

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
      toast.error("Nao foi possivel cadastrar o cliente.");
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
    } catch (error) {
      console.error("Comercial: erro ao registrar venda de animal", error);
      toast.error("Nao foi possivel registrar a venda do animal.");
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
    } catch (error) {
      console.error("Comercial: erro ao registrar venda de leite", error);
      toast.error("Nao foi possivel registrar a venda de leite.");
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
    } catch (error) {
      console.error("Comercial: erro ao marcar recebivel como pago", error);
      toast.error("Nao foi possivel registrar o recebimento.");
    } finally {
      setPaymentSubmittingKey(null);
    }
  }

  if (Number.isNaN(farmIdNumber)) {
    return (
      <div className="commercial-page commercial-page--centered">
        <div className="commercial-feedback commercial-feedback--error">
          <h1>Fazenda invalida</h1>
          <p>Nao foi possivel identificar a fazenda solicitada.</p>
          <button type="button" className="commercial-btn commercial-btn--secondary" onClick={() => navigate("/goatfarms")}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="commercial-page">
      <GoatFarmHeader name={farmData?.name || "Capril"} logoUrl={farmData?.logoUrl} farmId={farmIdNumber} />

      <section className="commercial-hero">
        <div>
          <p className="commercial-hero__eyebrow">Stage 2 · Camada comercial minima</p>
          <h1>Comercial e gerencial basico</h1>
          <p>Registro enxuto de clientes, vendas de animais, vendas de leite e recebiveis, sem abrir um ERP.</p>
        </div>
        <Link to={dashboardPath} className="commercial-btn commercial-btn--secondary">
          Voltar ao dashboard
        </Link>
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
          <section className="commercial-summary-grid">
            {summaryCards.map((card) => (
              <article key={card.label} className="commercial-card commercial-card--metric">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
            <article className="commercial-card commercial-card--metric">
              <span>Leite vendido</span>
              <strong>{formatCommercialNumber(summary.milkSalesQuantityLiters)} L</strong>
            </article>
            <article className="commercial-card commercial-card--metric">
              <span>Recebiveis pagos</span>
              <strong>{formatCommercialCurrency(summary.paidReceivablesTotal)}</strong>
            </article>
          </section>

          <section className="commercial-grid">
            <article className="commercial-card">
              <div className="commercial-card__header">
                <div>
                  <p className="commercial-card__eyebrow">Cadastro basico</p>
                  <h2>Clientes / compradores</h2>
                </div>
                <span className="commercial-card__chip">{customers.length} cadastrados</span>
              </div>
              <form className="commercial-form" onSubmit={handleCreateCustomer}>
                <label>
                  <span>Nome</span>
                  <input value={customerForm.name} onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))} required />
                </label>
                <label>
                  <span>Documento</span>
                  <input value={customerForm.document} onChange={(event) => setCustomerForm((prev) => ({ ...prev, document: event.target.value }))} />
                </label>
                <label>
                  <span>Telefone</span>
                  <input value={customerForm.phone} onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))} />
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" value={customerForm.email} onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))} />
                </label>
                <label className="commercial-form__full">
                  <span>Observacoes</span>
                  <textarea rows={3} value={customerForm.notes} onChange={(event) => setCustomerForm((prev) => ({ ...prev, notes: event.target.value }))} />
                </label>
                <button type="submit" className="commercial-btn commercial-btn--primary" disabled={submitting === "customer"}>
                  {submitting === "customer" ? "Salvando..." : "Cadastrar cliente"}
                </button>
              </form>

              <div className="commercial-table-shell">
                <table className="commercial-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Contato</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <strong>{customer.name}</strong>
                          {customer.document ? <small>{customer.document}</small> : null}
                        </td>
                        <td>
                          <span>{customer.phone || "-"}</span>
                          <small>{customer.email || "-"}</small>
                        </td>
                        <td>{customer.active ? "Ativo" : "Inativo"}</td>
                      </tr>
                    ))}
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={3}>Nenhum cliente cadastrado ainda.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="commercial-card">
              <div className="commercial-card__header">
                <div>
                  <p className="commercial-card__eyebrow">Venda comercial com saida coerente</p>
                  <h2>Venda de animal</h2>
                </div>
                <span className="commercial-card__chip">{animalSaleTotalPreview}</span>
              </div>
              <form className="commercial-form" onSubmit={handleCreateAnimalSale}>
                <label className="commercial-form__full">
                  <span>Animal</span>
                  <select value={animalSaleForm.goatId} onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, goatId: event.target.value }))} required>
                    <option value="">Selecione</option>
                    {goats.map((goat) => (
                      <option key={goat.registrationNumber} value={goat.registrationNumber}>
                        {goat.registrationNumber} · {goat.name} · {goat.status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Cliente</span>
                  <select
                    value={animalSaleForm.customerId || ""}
                    onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, customerId: Number(event.target.value) }))}
                    required
                    disabled={activeCustomers.length === 0}
                  >
                    {activeCustomers.length === 0 ? <option value="">Cadastre um cliente primeiro</option> : null}
                    {activeCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Data da venda</span>
                  <input type="date" value={animalSaleForm.saleDate} onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, saleDate: event.target.value }))} max={today} required />
                </label>
                <label>
                  <span>Valor</span>
                  <input type="number" min="0.01" step="0.01" value={animalSaleForm.amount || ""} onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, amount: Number(event.target.value) }))} required />
                </label>
                <label>
                  <span>Vencimento</span>
                  <input type="date" value={animalSaleForm.dueDate} onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, dueDate: event.target.value }))} required />
                </label>
                <label>
                  <span>Pagamento imediato</span>
                  <input type="date" value={animalSaleForm.paymentDate || ""} onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, paymentDate: event.target.value }))} max={today} />
                </label>
                <label className="commercial-form__full">
                  <span>Observacoes</span>
                  <textarea rows={3} value={animalSaleForm.notes || ""} onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, notes: event.target.value }))} />
                </label>
                <button type="submit" className="commercial-btn commercial-btn--primary" disabled={submitting === "animalSale" || activeCustomers.length === 0}>
                  {submitting === "animalSale" ? "Salvando..." : "Registrar venda do animal"}
                </button>
              </form>
            </article>

            <article className="commercial-card">
              <div className="commercial-card__header">
                <div>
                  <p className="commercial-card__eyebrow">Venda simples por fazenda</p>
                  <h2>Venda de leite</h2>
                </div>
                <span className="commercial-card__chip">{milkSaleTotalPreview}</span>
              </div>
              <form className="commercial-form" onSubmit={handleCreateMilkSale}>
                <label>
                  <span>Cliente</span>
                  <select
                    value={milkSaleForm.customerId || ""}
                    onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, customerId: Number(event.target.value) }))}
                    required
                    disabled={activeCustomers.length === 0}
                  >
                    {activeCustomers.length === 0 ? <option value="">Cadastre um cliente primeiro</option> : null}
                    {activeCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Data da venda</span>
                  <input type="date" value={milkSaleForm.saleDate} onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, saleDate: event.target.value }))} max={today} required />
                </label>
                <label>
                  <span>Quantidade (L)</span>
                  <input type="number" min="0.01" step="0.01" value={milkSaleForm.quantityLiters || ""} onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, quantityLiters: Number(event.target.value) }))} required />
                </label>
                <label>
                  <span>Preco unitario</span>
                  <input type="number" min="0.01" step="0.01" value={milkSaleForm.unitPrice || ""} onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, unitPrice: Number(event.target.value) }))} required />
                </label>
                <label>
                  <span>Vencimento</span>
                  <input type="date" value={milkSaleForm.dueDate} onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, dueDate: event.target.value }))} required />
                </label>
                <label>
                  <span>Pagamento imediato</span>
                  <input type="date" value={milkSaleForm.paymentDate || ""} onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, paymentDate: event.target.value }))} max={today} />
                </label>
                <label className="commercial-form__full">
                  <span>Observacoes</span>
                  <textarea rows={3} value={milkSaleForm.notes || ""} onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, notes: event.target.value }))} />
                </label>
                <button type="submit" className="commercial-btn commercial-btn--primary" disabled={submitting === "milkSale" || activeCustomers.length === 0}>
                  {submitting === "milkSale" ? "Salvando..." : "Registrar venda de leite"}
                </button>
              </form>
            </article>
          </section>

          <section className="commercial-grid commercial-grid--tables">
            <article className="commercial-card">
              <div className="commercial-card__header">
                <div>
                  <p className="commercial-card__eyebrow">Historico comercial</p>
                  <h2>Vendas de animais</h2>
                </div>
                <span className="commercial-card__chip">{animalSales.length}</span>
              </div>
              <div className="commercial-table-shell">
                <table className="commercial-table">
                  <thead>
                    <tr>
                      <th>Animal</th>
                      <th>Cliente</th>
                      <th>Venda</th>
                      <th>Recebimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animalSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>
                          <strong>{sale.goatRegistrationNumber}</strong>
                          <small>{sale.goatName}</small>
                        </td>
                        <td>{sale.customerName}</td>
                        <td>
                          <span>{formatCommercialDate(sale.saleDate)}</span>
                          <small>{formatCommercialCurrency(sale.amount)}</small>
                        </td>
                        <td>
                          <span>{formatPaymentStatusLabel(sale.paymentStatus)}</span>
                          <small>{formatCommercialDate(sale.paymentDate)}</small>
                        </td>
                      </tr>
                    ))}
                    {animalSales.length === 0 ? (
                      <tr>
                        <td colSpan={4}>Nenhuma venda de animal registrada ainda.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="commercial-card">
              <div className="commercial-card__header">
                <div>
                  <p className="commercial-card__eyebrow">Historico comercial</p>
                  <h2>Vendas de leite</h2>
                </div>
                <span className="commercial-card__chip">{milkSales.length}</span>
              </div>
              <div className="commercial-table-shell">
                <table className="commercial-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Venda</th>
                      <th>Total</th>
                      <th>Recebimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milkSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{sale.customerName}</td>
                        <td>
                          <span>{formatCommercialDate(sale.saleDate)}</span>
                          <small>{formatCommercialNumber(sale.quantityLiters)} L</small>
                        </td>
                        <td>
                          <span>{formatCommercialCurrency(sale.totalAmount)}</span>
                          <small>{formatCommercialCurrency(sale.unitPrice)} / L</small>
                        </td>
                        <td>
                          <span>{formatPaymentStatusLabel(sale.paymentStatus)}</span>
                          <small>{formatCommercialDate(sale.paymentDate)}</small>
                        </td>
                      </tr>
                    ))}
                    {milkSales.length === 0 ? (
                      <tr>
                        <td colSpan={4}>Nenhuma venda de leite registrada ainda.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="commercial-card">
            <div className="commercial-card__header">
              <div>
                <p className="commercial-card__eyebrow">Recebiveis minimos</p>
                <h2>Acompanhar recebimentos</h2>
              </div>
              <span className="commercial-card__chip">{receivables.length} registros</span>
            </div>
            <div className="commercial-table-shell">
              <table className="commercial-table">
                <thead>
                  <tr>
                    <th>Origem</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                    <th>Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((receivable) => {
                    const paymentKey = `${receivable.sourceType}-${receivable.sourceId}`;
                    const paymentDate = paymentDrafts[paymentKey] || today;
                    const open = isOpenReceivable(receivable);

                    return (
                      <tr key={paymentKey}>
                        <td>
                          <strong>{receivable.sourceLabel}</strong>
                          <small>{receivable.sourceType === "ANIMAL_SALE" ? "Venda de animal" : "Venda de leite"}</small>
                        </td>
                        <td>{receivable.customerName}</td>
                        <td>{formatCommercialCurrency(receivable.amount)}</td>
                        <td>{formatCommercialDate(receivable.dueDate)}</td>
                        <td>
                          <span>{formatPaymentStatusLabel(receivable.paymentStatus)}</span>
                          <small>{formatCommercialDate(receivable.paymentDate)}</small>
                        </td>
                        <td>
                          {open ? (
                            <div className="commercial-payment-inline">
                              <input
                                type="date"
                                value={paymentDate}
                                max={today}
                                onChange={(event) => setPaymentDrafts((prev) => ({ ...prev, [paymentKey]: event.target.value }))}
                              />
                              <button
                                type="button"
                                className="commercial-btn commercial-btn--secondary"
                                disabled={paymentSubmittingKey === paymentKey}
                                onClick={() => void handleRegisterPayment(receivable)}
                              >
                                {paymentSubmittingKey === paymentKey ? "Salvando..." : "Marcar pago"}
                              </button>
                            </div>
                          ) : (
                            <span className="commercial-muted">Recebido</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {receivables.length === 0 ? (
                    <tr>
                      <td colSpan={6}>Nenhum recebivel registrado ainda.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

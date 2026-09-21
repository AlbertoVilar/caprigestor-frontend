import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  acceptOwnershipSale,
  cancelOwnershipSale,
  listIncomingOwnershipSales,
  listOutgoingOwnershipSales,
  rejectOwnershipSale,
  registerOwnershipSalePayment,
  requestOwnershipSale,
} from "../../api/CommercialAPI/commercial";
import type { CustomerResponseDTO, OwnershipSaleRequestDTO, OwnershipSaleResponseDTO } from "../../Models/CommercialDTOs";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { todayInSaoPaulo } from "../../utils/civilDate";
import { getAllFarms } from "../../api/GoatFarmAPI/goatFarm";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import {
  createOwnershipSaleIdempotencyKey,
  getEligibleBuyerFarms,
  getOwnershipSaleIntent,
  resolveDefaultBuyerFarmId,
  type OwnershipSaleIntent,
} from "./ownershipSale.helpers";

type Props = { farmId: number; goats: GoatResponseDTO[]; customers: CustomerResponseDTO[]; canAdministerFarm: boolean; onChanged: () => void };

export function canRejectOwnershipSale(sale: OwnershipSaleResponseDTO): boolean {
  return sale.ownershipTransferStatus === "REQUESTED" && sale.paymentStatus !== "PAID";
}

export function canCancelOwnershipSale(sale: OwnershipSaleResponseDTO): boolean {
  return sale.ownershipTransferStatus === "REQUESTED" && sale.paymentStatus !== "PAID";
}

const today = todayInSaoPaulo();

export default function OwnershipSaleSection({ farmId, goats, customers, canAdministerFarm, onChanged }: Props) {
  const [incoming, setIncoming] = useState<OwnershipSaleResponseDTO[]>([]);
  const [outgoing, setOutgoing] = useState<OwnershipSaleResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [farms, setFarms] = useState<GoatFarmDTO[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [farmsError, setFarmsError] = useState<string | null>(null);
  const [paymentDates, setPaymentDates] = useState<Record<number, string>>({});
  const ownershipSaleIntentRef = useRef<OwnershipSaleIntent | null>(null);
  const activeCustomers = useMemo(() => customers.filter((customer) => customer.active), [customers]);
  const eligibleGoats = useMemo(() => goats.filter((goat) => goat.technicalId ?? goat.id), [goats]);
  const eligibleBuyerFarms = useMemo(() => getEligibleBuyerFarms(farms, farmId), [farms, farmId]);
  const [form, setForm] = useState<OwnershipSaleRequestDTO>({
    goatId: "", customerId: 0, targetFarmId: 0, saleDate: today, amount: 0, dueDate: today, notes: "", idempotencyKey: "",
  });

  const reload = useCallback(async () => {
    if (!Number.isFinite(farmId)) return;
    setLoading(true);
    try {
      const [incomingSales, outgoingSales] = await Promise.all([listIncomingOwnershipSales(farmId), listOutgoingOwnershipSales(farmId)]);
      setIncoming(incomingSales);
      setOutgoing(outgoingSales);
    } catch (error) {
      console.error("Venda com propriedade: erro ao carregar workflow", error);
      toast.error("Não foi possível carregar as vendas com transferência de propriedade.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    if (activeCustomers.length > 0) setForm((current) => ({ ...current, customerId: current.customerId || activeCustomers[0].id }));
  }, [activeCustomers]);

  useEffect(() => {
    let cancelled = false;
    setFarmsLoading(true);
    setFarmsError(null);
    void getAllFarms()
      .then((loadedFarms) => {
        if (!cancelled) setFarms(loadedFarms);
      })
      .catch(() => {
        if (!cancelled) setFarmsError("Não foi possível carregar as fazendas compradoras.");
      })
      .finally(() => {
        if (!cancelled) setFarmsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setForm((current) => {
      const currentDestinationIsValid = eligibleBuyerFarms.some((farm) => farm.id === current.targetFarmId);
      if (currentDestinationIsValid) return current;
      return { ...current, targetFarmId: resolveDefaultBuyerFarmId(eligibleBuyerFarms) };
    });
  }, [eligibleBuyerFarms]);

  useEffect(() => {
    const goat = eligibleGoats.find((candidate) => String(candidate.status).toUpperCase() === "ATIVO") ?? eligibleGoats[0];
    if (goat) setForm((current) => ({ ...current, goatId: current.goatId || `technical-${goat.technicalId ?? goat.id}` }));
  }, [eligibleGoats]);

  async function changed() { await reload(); onChanged(); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSubmitting(true);
      const intent = getOwnershipSaleIntent({
        current: ownershipSaleIntentRef.current,
        input: {
          goatId: form.goatId,
          targetFarmId: form.targetFarmId,
          customerId: form.customerId,
          saleDate: form.saleDate,
          amount: form.amount,
          dueDate: form.dueDate,
        },
        createKey: createOwnershipSaleIdempotencyKey,
      });
      ownershipSaleIntentRef.current = intent;
      await requestOwnershipSale(farmId, { ...form, notes: form.notes?.trim() || undefined, idempotencyKey: intent.key });
      toast.success("Venda com transferência de propriedade solicitada.");
      ownershipSaleIntentRef.current = null;
      setForm((current) => ({ ...current, amount: 0, notes: "", idempotencyKey: "" }));
      await changed();
    } catch (error) {
      console.error("Venda com propriedade: erro ao solicitar", error);
      toast.error("Não foi possível solicitar a venda com transferência.");
    } finally { setSubmitting(false); }
  }

  async function accept(sale: OwnershipSaleResponseDTO) {
    try {
      setSubmitting(true);
      await acceptOwnershipSale(sale.sourceFarmId, sale.saleId);
      toast.success("Venda aceita. O pagamento continua como etapa independente.");
      await changed();
    } catch (error) {
      console.error("Venda com propriedade: erro ao aceitar", error);
      toast.error("A aceitação não foi concluída; nenhuma transferência parcial foi aplicada.");
    } finally { setSubmitting(false); }
  }

  async function pay(sale: OwnershipSaleResponseDTO) {
    try {
      setSubmitting(true);
      await registerOwnershipSalePayment(sale.sourceFarmId, sale.saleId, { paymentDate: paymentDates[sale.saleId] || today });
      toast.success("Pagamento registrado; a propriedade será transferida quando o aceite também estiver concluído.");
      await changed();
    } catch (error) {
      console.error("Venda com propriedade: erro ao registrar pagamento", error);
      toast.error("Não foi possível registrar o pagamento.");
    } finally { setSubmitting(false); }
  }

  async function reject(sale: OwnershipSaleResponseDTO) {
    try { setSubmitting(true); await rejectOwnershipSale(sale.sourceFarmId, sale.saleId); toast.info("Venda rejeitada sem alterar a propriedade."); await changed(); }
    catch (error) { console.error("Venda com propriedade: erro ao rejeitar", error); toast.error("Não foi possível rejeitar a venda."); }
    finally { setSubmitting(false); }
  }

  async function cancel(sale: OwnershipSaleResponseDTO) {
    try { setSubmitting(true); await cancelOwnershipSale(farmId, sale.saleId); toast.info("Venda cancelada sem alterar a propriedade."); await changed(); }
    catch (error) { console.error("Venda com propriedade: erro ao cancelar", error); toast.error("Não foi possível cancelar a venda."); }
    finally { setSubmitting(false); }
  }

  return <section id="ownership-sale-workflow" className="commercial-grid commercial-grid--tables" aria-labelledby="ownership-sale-workflow-title">
    <article className="commercial-card">
      <div className="commercial-card__header"><div><p className="commercial-card__eyebrow">Propriedade canônica</p><h2 id="ownership-sale-workflow-title">Venda entre fazendas com transferência</h2></div></div>
      <p><strong>Venda com transferência de propriedade.</strong> Use este fluxo quando o comprador for outra fazenda, como o Capril Vilar. O animal permanece na fazenda vendedora até o pagamento e o aceite do comprador; só então o ownership passa para o destino.</p>
      {canAdministerFarm ? <form className="commercial-form" onSubmit={submit}>
        <label className="commercial-form__full"><span>Animal</span><select required value={form.goatId} onChange={(event) => setForm((current) => ({ ...current, goatId: event.target.value }))}><option value="">Selecione</option>{eligibleGoats.map((goat) => { const technicalId = goat.technicalId ?? goat.id; return <option key={technicalId} value={`technical-${technicalId}`}>{goat.registrationNumber} · {goat.name}</option>; })}</select></label>
        <label><span>Cliente</span><select required value={form.customerId || ""} onChange={(event) => setForm((current) => ({ ...current, customerId: Number(event.target.value) }))}>{activeCustomers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <label><span>Fazenda compradora</span><select required value={form.targetFarmId || ""} onChange={(event) => setForm((current) => ({ ...current, targetFarmId: Number(event.target.value) }))} disabled={farmsLoading || Boolean(farmsError)}><option value="">Selecione a fazenda compradora</option>{eligibleBuyerFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name} · ID {farm.id}</option>)}</select></label>
        <label><span>Data da venda</span><input required max={today} type="date" value={form.saleDate} onChange={(event) => setForm((current) => ({ ...current, saleDate: event.target.value }))} /></label>
        <label><span>Valor</span><input required min="0.01" step="0.01" type="number" value={form.amount || ""} onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))} /></label>
        <label><span>Vencimento</span><input required type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></label>
        <p className="commercial-form__full commercial-muted">A solicitação recebe automaticamente um identificador técnico para evitar duplicação caso o envio precise ser repetido.</p>
        {farmsError ? <p className="commercial-form__full commercial-error" role="alert">{farmsError}</p> : null}
        <label className="commercial-form__full"><span>Observações</span><textarea rows={2} value={form.notes || ""} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
        <button className="commercial-btn commercial-btn--primary" disabled={submitting || farmsLoading || Boolean(farmsError) || form.targetFarmId <= 0 || activeCustomers.length === 0 || eligibleGoats.length === 0} type="submit">Solicitar venda com transferência</button>
      </form> : <p className="commercial-muted">Apenas administradores da fazenda podem solicitar vendas com transferência de propriedade.</p>}
    </article>
    <article className="commercial-card">
      <div className="commercial-card__header"><div><p className="commercial-card__eyebrow">Aceitação do comprador</p><h2>Vendas pendentes</h2></div><span className="commercial-card__chip">{incoming.length}</span></div>
      <div className="commercial-table-shell"><table className="commercial-table"><thead><tr><th>Animal</th><th>Origem</th><th>Valor</th><th>Ação</th></tr></thead><tbody>
        {incoming.map((sale) => <tr key={sale.saleId}><td><strong>{sale.goatRegistrationNumber}</strong><small>{sale.goatName} · {sale.ownershipTransferStatus} · {sale.paymentStatus}</small></td><td>{sale.sourceFarmId}</td><td>R$ {Number(sale.amount).toFixed(2)}</td><td>{canAdministerFarm && sale.ownershipTransferStatus !== "COMPLETED" && sale.ownershipTransferStatus !== "REJECTED" && sale.ownershipTransferStatus !== "CANCELLED" ? <><input aria-label={`Data de pagamento da venda ${sale.saleId}`} type="date" max={today} value={paymentDates[sale.saleId] || today} onChange={(event) => setPaymentDates((current) => ({ ...current, [sale.saleId]: event.target.value }))} />{sale.paymentStatus !== "PAID" ? <button className="commercial-btn commercial-btn--secondary" disabled={submitting} type="button" onClick={() => void pay(sale)}>Registrar pagamento</button> : null}{sale.ownershipTransferStatus === "REQUESTED" ? <button className="commercial-btn commercial-btn--primary" disabled={submitting} type="button" onClick={() => void accept(sale)}>Aceitar</button> : null}{canRejectOwnershipSale(sale) ? <button className="commercial-btn commercial-btn--secondary" disabled={submitting} type="button" onClick={() => void reject(sale)}>Rejeitar</button> : null}</> : sale.ownershipTransferStatus}</td></tr>)}
        {!loading && incoming.length === 0 ? <tr><td colSpan={4}>Nenhuma venda de propriedade recebida.</td></tr> : null}
      </tbody></table></div>
    </article>
    <article className="commercial-card">
      <div className="commercial-card__header"><div><p className="commercial-card__eyebrow">Solicitações da fazenda</p><h2>Vendas enviadas</h2></div><span className="commercial-card__chip">{outgoing.length}</span></div>
      <div className="commercial-table-shell"><table className="commercial-table"><thead><tr><th>Animal</th><th>Destino</th><th>Status</th><th>Ação</th></tr></thead><tbody>
        {outgoing.map((sale) => <tr key={sale.saleId}><td><strong>{sale.goatRegistrationNumber}</strong><small>{sale.goatName}</small></td><td>{sale.targetFarmId}</td><td>{sale.ownershipTransferStatus}</td><td>{canAdministerFarm && canCancelOwnershipSale(sale) ? <button className="commercial-btn commercial-btn--secondary" disabled={submitting} type="button" onClick={() => void cancel(sale)}>Cancelar</button> : "-"}</td></tr>)}
        {!loading && outgoing.length === 0 ? <tr><td colSpan={4}>Nenhuma venda de propriedade enviada.</td></tr> : null}
      </tbody></table></div>
    </article>
  </section>;
}

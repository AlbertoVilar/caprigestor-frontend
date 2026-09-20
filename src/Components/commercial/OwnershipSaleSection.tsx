import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  acceptOwnershipSale,
  cancelOwnershipSale,
  listIncomingOwnershipSales,
  listOutgoingOwnershipSales,
  rejectOwnershipSale,
  requestOwnershipSale,
} from "../../api/CommercialAPI/commercial";
import type { CustomerResponseDTO, OwnershipSaleRequestDTO, OwnershipSaleResponseDTO } from "../../Models/CommercialDTOs";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { todayInSaoPaulo } from "../../utils/civilDate";

type Props = { farmId: number; goats: GoatResponseDTO[]; customers: CustomerResponseDTO[]; canAdministerFarm: boolean; onChanged: () => void };

const today = todayInSaoPaulo();

export default function OwnershipSaleSection({ farmId, goats, customers, canAdministerFarm, onChanged }: Props) {
  const [incoming, setIncoming] = useState<OwnershipSaleResponseDTO[]>([]);
  const [outgoing, setOutgoing] = useState<OwnershipSaleResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentDates, setPaymentDates] = useState<Record<number, string>>({});
  const activeCustomers = useMemo(() => customers.filter((customer) => customer.active), [customers]);
  const eligibleGoats = useMemo(() => goats.filter((goat) => goat.technicalId ?? goat.id), [goats]);
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
    const goat = eligibleGoats.find((candidate) => String(candidate.status).toUpperCase() === "ATIVO") ?? eligibleGoats[0];
    if (goat) setForm((current) => ({ ...current, goatId: current.goatId || `technical-${goat.technicalId ?? goat.id}` }));
  }, [eligibleGoats]);

  async function changed() { await reload(); onChanged(); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSubmitting(true);
      await requestOwnershipSale(farmId, { ...form, notes: form.notes?.trim() || undefined, idempotencyKey: form.idempotencyKey.trim() });
      toast.success("Venda com transferência de propriedade solicitada.");
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
      await acceptOwnershipSale(sale.sourceFarmId, sale.saleId, { paymentDate: paymentDates[sale.saleId] || today });
      toast.success("Venda aceita, recebimento registrado e propriedade transferida.");
      await changed();
    } catch (error) {
      console.error("Venda com propriedade: erro ao aceitar", error);
      toast.error("A aceitação não foi concluída; nenhuma transferência parcial foi aplicada.");
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

  return <section className="commercial-grid commercial-grid--tables">
    <article className="commercial-card">
      <div className="commercial-card__header"><div><p className="commercial-card__eyebrow">Propriedade canônica</p><h2>Solicitar venda entre fazendas</h2></div></div>
      <p>O animal permanece na fazenda vendedora até a aceitação e o recebimento interno pelo comprador.</p>
      {canAdministerFarm ? <form className="commercial-form" onSubmit={submit}>
        <label className="commercial-form__full"><span>Animal</span><select required value={form.goatId} onChange={(event) => setForm((current) => ({ ...current, goatId: event.target.value }))}><option value="">Selecione</option>{eligibleGoats.map((goat) => { const technicalId = goat.technicalId ?? goat.id; return <option key={technicalId} value={`technical-${technicalId}`}>{goat.registrationNumber} · {goat.name}</option>; })}</select></label>
        <label><span>Cliente</span><select required value={form.customerId || ""} onChange={(event) => setForm((current) => ({ ...current, customerId: Number(event.target.value) }))}>{activeCustomers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <label><span>Fazenda compradora (ID)</span><input required min="1" type="number" value={form.targetFarmId || ""} onChange={(event) => setForm((current) => ({ ...current, targetFarmId: Number(event.target.value) }))} /></label>
        <label><span>Data da venda</span><input required max={today} type="date" value={form.saleDate} onChange={(event) => setForm((current) => ({ ...current, saleDate: event.target.value }))} /></label>
        <label><span>Valor</span><input required min="0.01" step="0.01" type="number" value={form.amount || ""} onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))} /></label>
        <label><span>Vencimento</span><input required type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></label>
        <label className="commercial-form__full"><span>Chave de idempotência</span><input required value={form.idempotencyKey} onChange={(event) => setForm((current) => ({ ...current, idempotencyKey: event.target.value }))} placeholder="Ex.: venda-42-2026-09-18" /></label>
        <label className="commercial-form__full"><span>Observações</span><textarea rows={2} value={form.notes || ""} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
        <button className="commercial-btn commercial-btn--primary" disabled={submitting || activeCustomers.length === 0 || eligibleGoats.length === 0} type="submit">Solicitar venda com transferência</button>
      </form> : <p className="commercial-muted">Apenas administradores da fazenda podem solicitar vendas com transferência de propriedade.</p>}
    </article>
    <article className="commercial-card">
      <div className="commercial-card__header"><div><p className="commercial-card__eyebrow">Aceitação do comprador</p><h2>Vendas pendentes</h2></div><span className="commercial-card__chip">{incoming.length}</span></div>
      <div className="commercial-table-shell"><table className="commercial-table"><thead><tr><th>Animal</th><th>Origem</th><th>Valor</th><th>Ação</th></tr></thead><tbody>
        {incoming.map((sale) => <tr key={sale.saleId}><td><strong>{sale.goatRegistrationNumber}</strong><small>{sale.goatName} · {sale.ownershipTransferStatus}</small></td><td>{sale.sourceFarmId}</td><td>R$ {Number(sale.amount).toFixed(2)}</td><td>{sale.ownershipTransferStatus === "REQUESTED" && canAdministerFarm ? <><input aria-label={`Data de pagamento da venda ${sale.saleId}`} type="date" max={today} value={paymentDates[sale.saleId] || today} onChange={(event) => setPaymentDates((current) => ({ ...current, [sale.saleId]: event.target.value }))} /><button className="commercial-btn commercial-btn--primary" disabled={submitting} type="button" onClick={() => void accept(sale)}>Aceitar</button><button className="commercial-btn commercial-btn--secondary" disabled={submitting} type="button" onClick={() => void reject(sale)}>Rejeitar</button></> : sale.ownershipTransferStatus}</td></tr>)}
        {!loading && incoming.length === 0 ? <tr><td colSpan={4}>Nenhuma venda de propriedade recebida.</td></tr> : null}
      </tbody></table></div>
    </article>
    <article className="commercial-card">
      <div className="commercial-card__header"><div><p className="commercial-card__eyebrow">Solicitações da fazenda</p><h2>Vendas enviadas</h2></div><span className="commercial-card__chip">{outgoing.length}</span></div>
      <div className="commercial-table-shell"><table className="commercial-table"><thead><tr><th>Animal</th><th>Destino</th><th>Status</th><th>Ação</th></tr></thead><tbody>
        {outgoing.map((sale) => <tr key={sale.saleId}><td><strong>{sale.goatRegistrationNumber}</strong><small>{sale.goatName}</small></td><td>{sale.targetFarmId}</td><td>{sale.ownershipTransferStatus}</td><td>{sale.ownershipTransferStatus === "REQUESTED" && canAdministerFarm ? <button className="commercial-btn commercial-btn--secondary" disabled={submitting} type="button" onClick={() => void cancel(sale)}>Cancelar</button> : "-"}</td></tr>)}
        {!loading && outgoing.length === 0 ? <tr><td colSpan={4}>Nenhuma venda de propriedade enviada.</td></tr> : null}
      </tbody></table></div>
    </article>
  </section>;
}

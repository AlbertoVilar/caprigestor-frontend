import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  cancelOwnershipSale,
  listIncomingOwnershipSales,
  listOutgoingOwnershipSales,
  registerOwnershipSalePayment,
  requestOwnershipSale,
} from "../../api/CommercialAPI/commercial";
import { getAllFarms } from "../../api/GoatFarmAPI/goatFarm";
import type { CustomerResponseDTO, OwnershipSaleRequestDTO, OwnershipSaleResponseDTO } from "../../Models/CommercialDTOs";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { todayInSaoPaulo } from "../../utils/civilDate";

type Props = {
  farmId: number;
  goats: GoatResponseDTO[];
  /** Kept for compatibility with the page composition; internal sales never use customers. */
  customers?: CustomerResponseDTO[];
  canAdministerFarm: boolean;
  onChanged: () => void;
};

type InternalSaleForm = OwnershipSaleRequestDTO;
const today = todayInSaoPaulo();

type OwnershipSaleReadResult = {
  incoming?: OwnershipSaleResponseDTO[];
  outgoing?: OwnershipSaleResponseDTO[];
  farms?: GoatFarmDTO[];
  errors: {
    incoming?: unknown;
    outgoing?: unknown;
    farms?: unknown;
  };
};

/**
 * Loads each read surface independently so a history failure cannot hide the
 * destination-farm catalog (or discard another read that succeeded).
 */
export async function loadOwnershipSaleReads(farmId: number): Promise<OwnershipSaleReadResult> {
  const [incomingResult, outgoingResult, farmsResult] = await Promise.allSettled([
    listIncomingOwnershipSales(farmId),
    listOutgoingOwnershipSales(farmId),
    getAllFarms(),
  ]);

  return {
    incoming: incomingResult.status === "fulfilled" ? incomingResult.value : undefined,
    outgoing: outgoingResult.status === "fulfilled" ? outgoingResult.value : undefined,
    farms: farmsResult.status === "fulfilled" ? farmsResult.value : undefined,
    errors: {
      incoming: incomingResult.status === "rejected" ? incomingResult.reason : undefined,
      outgoing: outgoingResult.status === "rejected" ? outgoingResult.reason : undefined,
      farms: farmsResult.status === "rejected" ? farmsResult.reason : undefined,
    },
  };
}

function createIdempotencyKey(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  return randomUuid ? `internal-sale-${randomUuid}` : `internal-sale-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function canRejectOwnershipSale(sale: OwnershipSaleResponseDTO): boolean {
  // Canonical INTERNAL_SALE has no buyer acceptance/rejection workflow.
  void sale;
  return false;
}

export function canCancelOwnershipSale(sale: OwnershipSaleResponseDTO): boolean {
  return sale.ownershipTransferStatus === "REQUESTED" && sale.paymentStatus !== "PAID";
}

function farmLabel(farm: GoatFarmDTO): string {
  return `${farm.name} — TOD ${farm.tod}`;
}

export function selectDestinationFarms(farms: GoatFarmDTO[], sourceFarmId: number): GoatFarmDTO[] {
  return farms.filter((farm) => farm.id !== sourceFarmId);
}

function targetLabel(sale: OwnershipSaleResponseDTO): string {
  if (sale.targetFarmName) return `${sale.targetFarmName}${sale.targetFarmTod ? ` — TOD ${sale.targetFarmTod}` : ""}`;
  return "Fazenda destino";
}

function statusLabel(sale: OwnershipSaleResponseDTO): string {
  if (sale.ownershipTransferStatus === "COMPLETED") return "Concluída";
  if (sale.ownershipTransferStatus === "CANCELLED") return "Cancelada";
  if (sale.paymentStatus === "PAID") return "Pago — transferência concluída";
  return "Aguardando pagamento do vendedor";
}

export default function OwnershipSaleSection({ farmId, goats, canAdministerFarm, onChanged }: Props) {
  const [incoming, setIncoming] = useState<OwnershipSaleResponseDTO[]>([]);
  const [outgoing, setOutgoing] = useState<OwnershipSaleResponseDTO[]>([]);
  const [farms, setFarms] = useState<GoatFarmDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentDates, setPaymentDates] = useState<Record<number, string>>({});
  const eligibleGoats = useMemo(() => goats.filter((goat) => goat.technicalId ?? goat.id), [goats]);
  const destinationFarms = useMemo(() => selectDestinationFarms(farms, farmId), [farms, farmId]);
  const [form, setForm] = useState<InternalSaleForm>({
    goatId: "",
    targetFarmId: 0,
    saleDate: today,
    amount: 0,
    dueDate: today,
    paymentDate: "",
    notes: "",
    idempotencyKey: createIdempotencyKey(),
  });

  const reload = useCallback(async () => {
    if (!Number.isFinite(farmId)) return;
    setLoading(true);
    try {
      const reads = await loadOwnershipSaleReads(farmId);
      if (reads.incoming) setIncoming(reads.incoming);
      if (reads.outgoing) setOutgoing(reads.outgoing);
      if (reads.farms) setFarms(reads.farms);

      if (reads.errors.incoming) {
        console.error("Venda entre fazendas: erro ao carregar aquisições", reads.errors.incoming);
        toast.error("Não foi possível carregar as aquisições entre fazendas.");
      }
      if (reads.errors.outgoing) {
        console.error("Venda entre fazendas: erro ao carregar vendas enviadas", reads.errors.outgoing);
        toast.error("Não foi possível carregar as vendas entre fazendas enviadas.");
      }
      if (reads.errors.farms) {
        console.error("Venda entre fazendas: erro ao carregar destinos", reads.errors.farms);
        toast.error("Não foi possível carregar as fazendas de destino.");
      }
    } catch (error) {
      console.error("Venda entre fazendas: erro inesperado ao carregar workflow", error);
      toast.error("Não foi possível carregar o fluxo entre fazendas.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    const goat = eligibleGoats.find((candidate) => String(candidate.status).toUpperCase() === "ATIVO") ?? eligibleGoats[0];
    if (goat) setForm((current) => ({ ...current, goatId: current.goatId || `technical-${goat.technicalId ?? goat.id}` }));
  }, [eligibleGoats]);

  useEffect(() => {
    const firstDestination = destinationFarms[0];
    if (firstDestination) setForm((current) => ({ ...current, targetFarmId: current.targetFarmId || firstDestination.id }));
  }, [destinationFarms]);

  async function changed() { await reload(); onChanged(); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSubmitting(true);
      await requestOwnershipSale(farmId, {
        ...form,
        paymentDate: form.paymentDate || undefined,
        notes: form.notes?.trim() || undefined,
        idempotencyKey: form.idempotencyKey,
      });
      toast.success(form.paymentDate ? "Venda paga e transferência concluída." : "Venda entre fazendas registrada; aguarda pagamento do vendedor.");
      setForm((current) => ({ ...current, amount: 0, paymentDate: "", notes: "", idempotencyKey: createIdempotencyKey() }));
      await changed();
    } catch (error) {
      console.error("Venda entre fazendas: erro ao solicitar", error);
      toast.error("Não foi possível registrar a venda entre fazendas.");
    } finally { setSubmitting(false); }
  }

  async function pay(sale: OwnershipSaleResponseDTO) {
    try {
      setSubmitting(true);
      await registerOwnershipSalePayment(farmId, sale.saleId, { paymentDate: paymentDates[sale.saleId] || today });
      toast.success("Pagamento confirmado; propriedade transferida para a fazenda destino.");
      await changed();
    } catch (error) {
      console.error("Venda entre fazendas: erro ao registrar pagamento", error);
      toast.error("Não foi possível registrar o pagamento.");
    } finally { setSubmitting(false); }
  }

  async function cancel(sale: OwnershipSaleResponseDTO) {
    try {
      setSubmitting(true);
      await cancelOwnershipSale(farmId, sale.saleId);
      toast.info("Venda cancelada sem alterar a propriedade.");
      await changed();
    } catch (error) {
      console.error("Venda entre fazendas: erro ao cancelar", error);
      toast.error("Não foi possível cancelar a venda.");
    } finally { setSubmitting(false); }
  }

  return <section className="commercial-grid commercial-grid--tables">
    <article className="commercial-card">
      <div className="commercial-card__header"><div><p className="commercial-card__eyebrow">Venda patrimonial entre fazendas</p><h2>Vender para outra fazenda</h2></div></div>
      <p>Escolha a fazenda destino pelo nome. Sem pagamento, o animal continua na origem; o vendedor confirma o pagamento depois. Pagamento no ato conclui a transferência na mesma operação.</p>
      {canAdministerFarm ? <form className="commercial-form" onSubmit={submit}>
        <label className="commercial-form__full"><span>Animal</span><select required value={form.goatId} onChange={(event) => setForm((current) => ({ ...current, goatId: event.target.value }))}><option value="">Selecione</option>{eligibleGoats.map((goat) => { const technicalId = goat.technicalId ?? goat.id; return <option key={technicalId} value={`technical-${technicalId}`}>{goat.registrationNumber} · {goat.name}</option>; })}</select></label>
        <label className="commercial-form__full"><span>Fazenda destino</span><select required value={form.targetFarmId || ""} onChange={(event) => setForm((current) => ({ ...current, targetFarmId: Number(event.target.value) }))}><option value="">Selecione a fazenda destino</option>{destinationFarms.map((farm) => <option key={farm.id} value={farm.id}>{farmLabel(farm)}</option>)}</select></label>
        <label><span>Data da venda</span><input required max={today} type="date" value={form.saleDate} onChange={(event) => setForm((current) => ({ ...current, saleDate: event.target.value }))} /></label>
        <label><span>Valor</span><input required min="0.01" step="0.01" type="number" value={form.amount || ""} onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))} /></label>
        <label><span>Vencimento</span><input required type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></label>
        <label><span>Pagamento no ato (opcional)</span><input max={today} type="date" value={form.paymentDate || ""} onChange={(event) => setForm((current) => ({ ...current, paymentDate: event.target.value }))} /></label>
        <label className="commercial-form__full"><span>Observações</span><textarea rows={2} value={form.notes || ""} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
        <button className="commercial-btn commercial-btn--primary" disabled={submitting || destinationFarms.length === 0 || eligibleGoats.length === 0} type="submit">Registrar venda entre fazendas</button>
      </form> : <p className="commercial-muted">Apenas administradores da fazenda podem registrar vendas entre fazendas.</p>}
      {canAdministerFarm && destinationFarms.length === 0 ? <p className="commercial-muted">Nenhuma outra fazenda disponível para seleção.</p> : null}
    </article>

    <article className="commercial-card">
      <div className="commercial-card__header"><div><p className="commercial-card__eyebrow">Histórico de aquisições</p><h2>Recebidas por esta fazenda</h2></div><span className="commercial-card__chip">{incoming.length}</span></div>
      <p className="commercial-muted">A fazenda compradora consulta o histórico. O pagamento e a confirmação são feitos pelo vendedor.</p>
      <div className="commercial-table-shell"><table className="commercial-table"><thead><tr><th>Animal</th><th>Origem</th><th>Valor</th><th>Status</th></tr></thead><tbody>
        {incoming.map((sale) => <tr key={sale.saleId}><td><strong>{sale.goatRegistrationNumber}</strong><small>{sale.goatName}</small></td><td>Fazenda de origem</td><td>R$ {Number(sale.amount).toFixed(2)}</td><td>{statusLabel(sale)}</td></tr>)}
        {!loading && incoming.length === 0 ? <tr><td colSpan={4}>Nenhuma aquisição registrada para esta fazenda.</td></tr> : null}
      </tbody></table></div>
    </article>

    <article className="commercial-card">
      <div className="commercial-card__header"><div><p className="commercial-card__eyebrow">Controle do vendedor</p><h2>Vendas enviadas</h2></div><span className="commercial-card__chip">{outgoing.length}</span></div>
      <div className="commercial-table-shell"><table className="commercial-table"><thead><tr><th>Animal</th><th>Destino</th><th>Status</th><th>Ação</th></tr></thead><tbody>
        {outgoing.map((sale) => { const canPay = canAdministerFarm && sale.paymentStatus !== "PAID" && sale.ownershipTransferStatus === "REQUESTED"; return <tr key={sale.saleId}><td><strong>{sale.goatRegistrationNumber}</strong><small>{sale.goatName}</small></td><td>{targetLabel(sale)}</td><td>{statusLabel(sale)}</td><td>{canPay ? <div className="commercial-payment-inline"><input aria-label={`Data de pagamento da venda ${sale.saleId}`} type="date" max={today} value={paymentDates[sale.saleId] || today} onChange={(event) => setPaymentDates((current) => ({ ...current, [sale.saleId]: event.target.value }))} /><button className="commercial-btn commercial-btn--secondary" disabled={submitting} type="button" onClick={() => void pay(sale)}>Confirmar pagamento</button>{canCancelOwnershipSale(sale) ? <button className="commercial-btn commercial-btn--secondary" disabled={submitting} type="button" onClick={() => void cancel(sale)}>Cancelar</button> : null}</div> : <span className="commercial-muted">-</span>}</td></tr>; })}
        {!loading && outgoing.length === 0 ? <tr><td colSpan={4}>Nenhuma venda entre fazendas enviada.</td></tr> : null}
      </tbody></table></div>
    </article>
  </section>;
}

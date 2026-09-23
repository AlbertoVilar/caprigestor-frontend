import React from "react";
import OperationalExpenseSection from "./OperationalExpenseSection";
import type { ReceivableResponseDTO } from "../../Models/CommercialDTOs";
import type { OperationalAuditEntryDTO } from "../../Models/OperationalAuditDTOs";
import {
  formatCommercialCurrency,
  formatCommercialDate,
  formatReceivableStatusLabel,
  isOpenReceivable,
  isOverdueReceivable,
} from "../../Pages/commercial/commercial.helpers";

export type CommercialFinanceTabProps = {
  farmId: number;
  receivables: ReceivableResponseDTO[];
  exportReceivablesCsv: () => void;
  paymentDrafts: Record<string, string>;
  setPaymentDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  paymentSubmittingKey: string | null;
  handleRegisterPayment: (receivable: ReceivableResponseDTO) => void;
  onExpenseChanged: () => void;
  auditEntries: OperationalAuditEntryDTO[];
  formatAuditDateTime: (value?: string | null) => string;
  today: string;
};

export default function CommercialFinanceTab({
  farmId,
  receivables,
  exportReceivablesCsv,
  paymentDrafts,
  setPaymentDrafts,
  paymentSubmittingKey,
  handleRegisterPayment,
  onExpenseChanged,
  auditEntries,
  formatAuditDateTime,
  today,
}: CommercialFinanceTabProps) {
  return (
    <div className="commercial-finance-tab">
      {/* SEÇÃO 1: RECEBÍVEIS */}
      <section className="commercial-card">
        <div className="commercial-card__header">
          <div>
            <p className="commercial-card__eyebrow">Recebiveis operacionais</p>
            <h2>Acompanhar recebimentos</h2>
          </div>
          <div className="commercial-card__actions">
            <span className="commercial-card__chip">{receivables.length} registros</span>
            <button
              type="button"
              className="commercial-btn commercial-btn--secondary"
              onClick={exportReceivablesCsv}
              disabled={receivables.length === 0}
            >
              Exportar CSV
            </button>
          </div>
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
                      <small>
                        {receivable.sourceType === "ANIMAL_SALE" ? "Venda de animal" : "Venda de leite"}
                      </small>
                    </td>
                    <td>{receivable.customerName}</td>
                    <td>{formatCommercialCurrency(receivable.amount)}</td>
                    <td>{formatCommercialDate(receivable.dueDate)}</td>
                    <td>
                      <span
                        className={
                          isOverdueReceivable(receivable, today)
                            ? "commercial-status commercial-status--overdue"
                            : "commercial-status"
                        }
                      >
                        {formatReceivableStatusLabel(receivable, today)}
                      </span>
                      <small>{formatCommercialDate(receivable.paymentDate)}</small>
                    </td>
                    <td>
                      {open ? (
                        <div className="commercial-payment-inline">
                          <input
                            type="date"
                            value={paymentDate}
                            max={today}
                            onChange={(event) =>
                              setPaymentDrafts((prev) => ({ ...prev, [paymentKey]: event.target.value }))
                            }
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

      {/* SEÇÃO 2: DESPESAS OPERACIONAIS */}
      <OperationalExpenseSection farmId={farmId} onChanged={onExpenseChanged} />

      {/* SEÇÃO 3: AUDITORIA OPERACIONAL */}
      <section className="commercial-card">
        <div className="commercial-card__header">
          <div>
            <p className="commercial-card__eyebrow">Auditabilidade comercial</p>
            <h2>Operações críticas recentes</h2>
          </div>
          <span className="commercial-card__chip">{auditEntries.length} registros</span>
        </div>
        <div className="commercial-table-shell">
          <table className="commercial-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Operacao</th>
                <th>Ator</th>
                <th>Descricao</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatAuditDateTime(entry.createdAt)}</td>
                  <td>
                    <strong>{entry.actionLabel}</strong>
                    <small>{entry.goatRegistrationNumber || "-"}</small>
                  </td>
                  <td>
                    <span>{entry.actorName}</span>
                    <small>{entry.actorEmail}</small>
                  </td>
                  <td>{entry.description}</td>
                </tr>
              ))}
              {auditEntries.length === 0 ? (
                <tr>
                  <td colSpan={4}>Nenhuma operação crítica auditada ainda nesta fazenda.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

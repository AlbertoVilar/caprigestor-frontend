import MonthlyOperationalSummarySection from "./MonthlyOperationalSummarySection";
import type { CommercialSummaryDTO } from "../../Models/CommercialDTOs";
import type { CommercialTabKey } from "../../Pages/commercial/commercial.helpers";
import {
  formatCommercialCurrency,
  formatCommercialNumber,
} from "../../Pages/commercial/commercial.helpers";

export type CommercialOverviewTabProps = {
  farmId: number;
  summary: CommercialSummaryDTO;
  summaryCards: Array<{ label: string; value: string }>;
  overdueReceivablesCount: number;
  financeReloadToken: number;
  onSelectTab: (tab: CommercialTabKey) => void;
};

export default function CommercialOverviewTab({
  farmId,
  summary,
  summaryCards,
  overdueReceivablesCount,
  financeReloadToken,
  onSelectTab,
}: CommercialOverviewTabProps) {
  return (
    <div className="commercial-overview-tab">
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
        <article className="commercial-card commercial-card--metric">
          <span>Recebiveis em atraso</span>
          <strong>{String(overdueReceivablesCount)}</strong>
        </article>
      </section>

      <MonthlyOperationalSummarySection farmId={farmId} reloadToken={financeReloadToken} />

      <section className="commercial-card">
        <div className="commercial-card__header">
          <div>
            <p className="commercial-card__eyebrow">Atalhos operacionais</p>
            <h2>Acesso rápido aos fluxos comerciais</h2>
          </div>
        </div>
        <div className="commercial-shortcuts-grid">
          <button
            type="button"
            className="commercial-btn commercial-btn--secondary commercial-shortcut-btn"
            onClick={() => onSelectTab("animals")}
          >
            <strong>Venda de animais</strong>
            <span>Vendas externas e entre fazendas</span>
          </button>
          <button
            type="button"
            className="commercial-btn commercial-btn--secondary commercial-shortcut-btn"
            onClick={() => onSelectTab("milk")}
          >
            <strong>Venda de leite</strong>
            <span>Registros diários e histórico</span>
          </button>
          <button
            type="button"
            className="commercial-btn commercial-btn--secondary commercial-shortcut-btn"
            onClick={() => onSelectTab("customers")}
          >
            <strong>Clientes</strong>
            <span>Cadastro e lista de compradores</span>
          </button>
          <button
            type="button"
            className="commercial-btn commercial-btn--secondary commercial-shortcut-btn"
            onClick={() => onSelectTab("finance")}
          >
            <strong>Financeiro</strong>
            <span>Recebíveis, despesas e auditoria</span>
          </button>
        </div>
      </section>
    </div>
  );
}

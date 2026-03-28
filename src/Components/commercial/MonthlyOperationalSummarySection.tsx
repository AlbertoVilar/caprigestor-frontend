import { useEffect, useMemo, useState } from "react";
import { fetchMonthlyOperationalSummary } from "../../api/CommercialAPI/commercial";
import type { MonthlyOperationalSummaryDTO } from "../../Models/CommercialDTOs";
import { formatCommercialCurrency } from "../../Pages/commercial/commercial.helpers";
import { buildMonthlyOperationalSummaryCards } from "./operationalFinance.helpers";

type MonthlyOperationalSummarySectionProps = {
  farmId: number;
  reloadToken?: number;
};

const today = new Date().toISOString().slice(0, 7);

const emptySummary: MonthlyOperationalSummaryDTO = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  totalRevenue: 0,
  totalExpenses: 0,
  balance: 0,
  animalSalesRevenue: 0,
  milkSalesRevenue: 0,
  operationalExpensesTotal: 0,
  inventoryPurchaseCostsTotal: 0,
};

export default function MonthlyOperationalSummarySection({
  farmId,
  reloadToken = 0,
}: MonthlyOperationalSummarySectionProps) {
  const [selectedMonth, setSelectedMonth] = useState(today);
  const [summary, setSummary] = useState<MonthlyOperationalSummaryDTO>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cards = useMemo(() => buildMonthlyOperationalSummaryCards(summary), [summary]);

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      const [yearValue, monthValue] = selectedMonth.split("-").map(Number);

      setLoading(true);
      setError("");

      try {
        const result = await fetchMonthlyOperationalSummary(farmId, yearValue, monthValue);
        if (!active) return;
        setSummary(result);
      } catch (loadError) {
        console.error("Financeiro operacional: erro ao carregar resumo mensal", loadError);
        if (!active) return;
        setError("Nao foi possivel carregar o resumo mensal.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      active = false;
    };
  }, [farmId, selectedMonth, reloadToken]);

  return (
    <section className="commercial-card">
      <div className="commercial-card__header">
        <div>
          <p className="commercial-card__eyebrow">Financeiro operacional minimo</p>
          <h2>Resumo mensal da fazenda</h2>
        </div>
        <label className="commercial-inline-field">
          <span>Mes</span>
          <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
        </label>
      </div>

      {loading ? <div className="commercial-feedback">Carregando resumo mensal...</div> : null}
      {error ? <div className="commercial-feedback commercial-feedback--error">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="commercial-summary-grid commercial-summary-grid--finance">
            {cards.map((card) => (
              <article key={card.label} className="commercial-card commercial-card--metric commercial-card--nested">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>

          <div className="commercial-card commercial-card--nested commercial-finance-breakdown">
            <div>
              <span>Receita recebida</span>
              <strong>{formatCommercialCurrency(summary.totalRevenue)}</strong>
            </div>
            <div>
              <span>Despesa total</span>
              <strong>{formatCommercialCurrency(summary.totalExpenses)}</strong>
            </div>
            <div>
              <span>Saldo do periodo</span>
              <strong>{formatCommercialCurrency(summary.balance)}</strong>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

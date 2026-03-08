import { Cell, Pie, PieChart } from "recharts";
import type { GoatHerdSummaryDTO } from "../../Models/GoatHerdSummaryDTO";
import { Button } from "../ui";
import "./GoatDashboardSummary.css";

interface Props {
  summary: GoatHerdSummaryDTO | null;
  visibleCount: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

interface SummaryItem {
  label: string;
  value: number;
  tone?: "success" | "warning" | "danger" | "neutral";
}

interface ChartDatum {
  label: string;
  value: number;
  color: string;
}

const SEX_COLORS = ["#2563eb", "#ec4899"];
const STATUS_COLORS = ["#10b981", "#f59e0b", "#f43f5e", "#64748b"];
const BREED_COLORS = ["#14b8a6", "#8b5cf6", "#f97316", "#22c55e", "#3b82f6", "#94a3b8"];

function formatAnimalCount(value: number) {
  return `${value} ${value === 1 ? "animal" : "animais"}`;
}

function buildBreedChartData(summary: GoatHerdSummaryDTO): ChartDatum[] {
  const ranked = [...summary.breeds]
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count || left.breed.localeCompare(right.breed))
    .slice(0, 5)
    .map((entry, index) => ({
      label: entry.breed,
      value: entry.count,
      color: BREED_COLORS[index % BREED_COLORS.length],
    }));

  const topCount = ranked.reduce((accumulator, entry) => accumulator + entry.value, 0);
  const otherCount = Math.max(summary.total - topCount, 0);

  if (otherCount > 0) {
    ranked.push({
      label: "Outras raças",
      value: otherCount,
      color: BREED_COLORS[BREED_COLORS.length - 1],
    });
  }

  return ranked;
}

function ChartPanel({
  title,
  subtitle,
  totalLabel,
  data,
}: {
  title: string;
  subtitle: string;
  totalLabel: string;
  data: ChartDatum[];
}) {
  if (data.length === 0) {
    return (
      <article className="goat-summary__panel goat-summary__panel--empty">
        <header className="goat-summary__panel-header">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </header>
        <p className="goat-summary__empty-copy">
          Ainda não há dados suficientes para exibir este gráfico.
        </p>
      </article>
    );
  }

  return (
    <article className="goat-summary__panel">
      <header className="goat-summary__panel-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>

      <div className="goat-summary__chart-shell">
        <div className="goat-summary__chart-center" aria-hidden="true">
          <strong>{totalLabel}</strong>
          <span>rebanho</span>
        </div>

        <PieChart width={210} height={210}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={82}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </div>

      <ul className="goat-summary__legend" aria-label={`Legenda de ${title.toLowerCase()}`}>
        {data.map((entry) => (
          <li key={entry.label} className="goat-summary__legend-item">
            <span
              className="goat-summary__legend-dot"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="goat-summary__legend-label">{entry.label}</span>
            <strong className="goat-summary__legend-value">{entry.value}</strong>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function GoatDashboardSummary({
  summary,
  visibleCount,
  loading = false,
  error = null,
  onRetry,
}: Props) {
  if (loading) {
    return (
      <section className="goat-summary goat-summary--loading" aria-label="Resumo do rebanho">
        <header className="goat-summary__header">
          <span className="goat-summary__eyebrow">Resumo do rebanho</span>
          <strong className="goat-summary__headline">
            Carregando indicadores da fazenda...
          </strong>
        </header>
      </section>
    );
  }

  if (error || !summary) {
    return (
      <section className="goat-summary goat-summary--error" aria-label="Resumo do rebanho">
        <header className="goat-summary__header">
          <span className="goat-summary__eyebrow">Resumo do rebanho</span>
          <strong className="goat-summary__headline">
            Não foi possível carregar os indicadores da fazenda.
          </strong>
        </header>
        {error ? <p className="goat-summary__error-copy">{error}</p> : null}
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        ) : null}
      </section>
    );
  }

  const items: SummaryItem[] = [
    { label: "Total", value: summary.total },
    { label: "Machos", value: summary.males },
    { label: "Fêmeas", value: summary.females },
    { label: "Ativos", value: summary.active, tone: "success" },
    { label: "Inativos", value: summary.inactive, tone: "warning" },
    { label: "Vendidos", value: summary.sold, tone: "danger" },
    { label: "Falecidos", value: summary.deceased, tone: "neutral" },
  ];

  const sexData: ChartDatum[] = [
    { label: "Machos", value: summary.males, color: SEX_COLORS[0] },
    { label: "Fêmeas", value: summary.females, color: SEX_COLORS[1] },
  ].filter((entry) => entry.value > 0);

  const statusData: ChartDatum[] = [
    { label: "Ativos", value: summary.active, color: STATUS_COLORS[0] },
    { label: "Inativos", value: summary.inactive, color: STATUS_COLORS[1] },
    { label: "Vendidos", value: summary.sold, color: STATUS_COLORS[2] },
    { label: "Falecidos", value: summary.deceased, color: STATUS_COLORS[3] },
  ].filter((entry) => entry.value > 0);

  const breedData = buildBreedChartData(summary);

  return (
    <section className="goat-summary" aria-label="Resumo do rebanho da fazenda">
      <header className="goat-summary__header">
        <div>
          <span className="goat-summary__eyebrow">Resumo do rebanho</span>
          <strong className="goat-summary__headline">
            {formatAnimalCount(summary.total)} no rebanho
          </strong>
        </div>

        <p className="goat-summary__subheadline">
          {formatAnimalCount(visibleCount)} exibid{visibleCount === 1 ? "o" : "os"} nesta tela
        </p>
      </header>

      <div className="goat-summary__grid">
        {items.map((item) => (
          <div
            key={item.label}
            className={`goat-summary__chip goat-summary__chip--${item.tone ?? "default"}`}
          >
            <span className="goat-summary__label">{item.label}</span>
            <strong className="goat-summary__value">{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="goat-summary__panels">
        <ChartPanel
          title="Distribuição por sexo"
          subtitle="Visão geral rápida do rebanho por machos e fêmeas."
          totalLabel={formatAnimalCount(summary.total)}
          data={sexData}
        />

        <ChartPanel
          title="Situação do rebanho"
          subtitle="Animais ativos, inativos, vendidos e falecidos."
          totalLabel={formatAnimalCount(summary.total)}
          data={statusData}
        />

        <ChartPanel
          title="Raças cadastradas"
          subtitle="Principais raças da fazenda, agrupando excedentes em outras."
          totalLabel={`${summary.breeds.length} raça${summary.breeds.length === 1 ? "" : "s"}`}
          data={breedData}
        />
      </div>
    </section>
  );
}

import "./GoatDashboardSummary.css";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { GoatGenderEnum, GoatStatusEnum } from "../../types/goatEnums";

interface Props {
  goats: GoatResponseDTO[];
}

interface SummaryItem {
  label: string;
  value: number;
  tone?: "success" | "warning" | "danger" | "neutral";
}

export default function GoatDashboardSummary({ goats }: Props) {
  const total = goats.length;

  const males = goats.filter(
    (g) =>
      g.gender === GoatGenderEnum.MALE ||
      g.gender === "MALE" ||
      g.gender === "M" ||
      g.gender === "Macho"
  ).length;

  const females = goats.filter(
    (g) =>
      g.gender === GoatGenderEnum.FEMALE ||
      g.gender === "FEMALE" ||
      g.gender === "F" ||
      g.gender === "Fêmea"
  ).length;

  const active = goats.filter(
    (g) =>
      g.status === GoatStatusEnum.ATIVO ||
      g.status === "ATIVO" ||
      g.status === "Ativo"
  ).length;

  const sold = goats.filter(
    (g) =>
      g.status === GoatStatusEnum.SOLD ||
      g.status === "SOLD" ||
      g.status === "Vendido"
  ).length;

  const deceased = goats.filter(
    (g) =>
      g.status === GoatStatusEnum.DECEASED ||
      g.status === "DECEASED" ||
      g.status === "Morto" ||
      g.status === "Falecido"
  ).length;

  const inactive = goats.filter(
    (g) =>
      g.status === GoatStatusEnum.INACTIVE ||
      g.status === "INACTIVE" ||
      g.status === "Inativo"
  ).length;

  const items: SummaryItem[] = [
    { label: "Total", value: total },
    { label: "Machos", value: males },
    { label: "Fêmeas", value: females },
    { label: "Ativos", value: active, tone: "success" },
    { label: "Inativos", value: inactive, tone: "warning" },
    { label: "Vendidos", value: sold, tone: "danger" },
    { label: "Falecidos", value: deceased, tone: "neutral" },
  ];

  return (
    <section className="goat-summary" aria-label="Resumo do rebanho filtrado">
      <header className="goat-summary__header">
        <span className="goat-summary__eyebrow">Resumo do rebanho</span>
        <strong className="goat-summary__headline">{total} animal{total === 1 ? "" : "is"} nesta lista</strong>
      </header>

      <div className="goat-summary__grid">
        {items.map((item) => (
          <div key={item.label} className={`goat-summary__chip goat-summary__chip--${item.tone ?? "default"}`}>
            <span className="goat-summary__label">{item.label}</span>
            <strong className="goat-summary__value">{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

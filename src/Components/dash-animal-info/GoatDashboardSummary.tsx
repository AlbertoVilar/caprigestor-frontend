// src/components/goat-dashboard-summary/GoatDashboardSummary.tsx
import "./GoatDashboardSummary.css";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

interface Props {
  goats: GoatResponseDTO[];
}

export default function GoatDashboardSummary({ goats }: Props) {
  const total = goats.length;
  const males = goats.filter((g) => g.gender === "MALE").length;
  const females = goats.filter((g) => g.gender === "FEMALE").length;
  const active = goats.filter((g) => g.status === "ATIVO").length;
  const sold = goats.filter((g) => g.status === "SOLD").length;
  const deceased = goats.filter((g) => g.status === "DECEASED").length;

  return (
    <div className="goat-summary">
      <span>🐐 Total: {total}</span> |{" "}
      <span>♂️ {males}</span> | <span>♀️ {females}</span> |{" "}
      <span className="ativo">🟢 Ativos: {active}</span> |{" "}
      <span className="vendido">🔴 Vendidos: {sold}</span> |{" "}
      <span className="falecido">⚰️ Falecidos: {deceased}</span>
    </div>
  );
}

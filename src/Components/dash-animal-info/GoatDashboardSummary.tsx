// src/components/goat-dashboard-summary/GoatDashboardSummary.tsx
import "./GoatDashboardSummary.css";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { GoatGenderEnum, GoatStatusEnum } from "../../types/goatEnums";

interface Props {
  goats: GoatResponseDTO[];
}

export default function GoatDashboardSummary({ goats }: Props) {

  const total = goats.length;
  
  // Filtros corrigidos para considerar diferentes formatos de dados
  const males = goats.filter((g) => 
    g.gender === GoatGenderEnum.MALE || 
    g.gender === "MALE" || 
    g.gender === "M" || 
    g.gender === "Macho"
  ).length;
  
  const females = goats.filter((g) => 
    g.gender === GoatGenderEnum.FEMALE || 
    g.gender === "FEMALE" || 
    g.gender === "F" || 
    g.gender === "Fêmea"
  ).length;
  
  const active = goats.filter((g) => 
    g.status === GoatStatusEnum.ATIVO || 
    g.status === "ATIVO" || 
    g.status === "Ativo"
  ).length;
  
  const sold = goats.filter((g) => 
    g.status === GoatStatusEnum.SOLD || 
    g.status === "SOLD" || 
    g.status === "Vendido"
  ).length;
  
  const deceased = goats.filter((g) => 
    g.status === GoatStatusEnum.DECEASED || 
    g.status === "DECEASED" || 
    g.status === "Morto" || 
    g.status === "Falecido"
  ).length;

  const inactive = goats.filter((g) => 
    g.status === GoatStatusEnum.INACTIVE || 
    g.status === "INACTIVE" || 
    g.status === "Inativo"
  ).length;

  return (
    <div className="goat-summary">
      <span>🐐 Total: {total}</span> |{" "}
      <span>♂️ {males}</span> | <span>♀️ {females}</span> |{" "}
      <span className="ativo">🟢 Ativos: {active}</span> |{" "}
      <span className="inativo">🟡 Inativos: {inactive}</span> |{" "}
      <span className="vendido">🔴 Vendidos: {sold}</span> |{" "}
      <span className="falecido">🪦 Falecidos: {deceased}</span>
    </div>
  );
}

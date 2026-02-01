import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { categoryDisplayMap } from '../../utils/Translate-Map/categoryDisplayMap';
import { statusDisplayMap } from "../../utils/Translate-Map/statusDisplayMap";
import { genderDisplayMap } from "../../utils/Translate-Map/genderDisplayMap";
import './goatInfo.css';

interface Props {
  goat: GoatResponseDTO;
}

export default function GoatInfoCard({ goat }: Props) {
  const displayedStatus = statusDisplayMap[goat.status] || goat.status;
  const displayedGender = genderDisplayMap[goat.gender] || goat.gender;
  const displayedCategory = categoryDisplayMap[goat.category] || goat.category;

  return (
    <div className="goat-info-container">
      <div className="goat-info-header">
        <h2 className="goat-name">{goat.name}</h2>
        <span className={`status-badge ${goat.status?.toLowerCase()}`}>
          {displayedStatus}
        </span>
      </div>

      <div className="goat-info-grid">
        <div className="info-group">
          <label>Registro</label>
          <div className="value">{goat.registrationNumber || "-"}</div>
        </div>

        <div className="info-group">
          <label>Sexo</label>
          <div className="value">{displayedGender}</div>
        </div>

        <div className="info-group">
          <label>Raça</label>
          <div className="value">{goat.breed}</div>
        </div>

        <div className="info-group">
          <label>Pelagem</label>
          <div className="value">{goat.color}</div>
        </div>

        <div className="info-group">
          <label>Nascimento</label>
          <div className="value">{goat.birthDate}</div>
        </div>

        <div className="info-group">
          <label>Categoria</label>
          <div className="value">{displayedCategory}</div>
        </div>

        <div className="info-group">
          <label>TOD</label>
          <div className="value">{goat.tod || "-"}</div>
        </div>

        <div className="info-group">
          <label>TOE</label>
          <div className="value">{goat.toe || "-"}</div>
        </div>

        <div className="info-group full-width">
          <label>Genealogia (Pai / Mãe)</label>
          <div className="value">
            {goat.fatherName || "Pai desconhecido"} / {goat.motherName || "Mãe desconhecida"}
          </div>
        </div>

        <div className="info-group full-width">
          <label>Fazenda</label>
          <div className="value">{goat.farmName}</div>
        </div>
      </div>
    </div>
  );
}

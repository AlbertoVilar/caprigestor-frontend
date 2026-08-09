import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { categoryDisplayMap } from "../../utils/Translate-Map/categoryDisplayMap";
import { genderDisplayMap } from "../../utils/Translate-Map/genderDisplayMap";
import { statusDisplayMap } from "../../utils/Translate-Map/statusDisplayMap";
import "./goatInfo.css";

interface Props {
  goat: GoatResponseDTO;
}

export default function GoatInfoCard({ goat }: Props) {
  const displayedStatus = statusDisplayMap[goat.status] || goat.status;
  const displayedGender = genderDisplayMap[goat.gender] || goat.gender;
  const displayedCategory = categoryDisplayMap[goat.category] || goat.category;
  const hasExitData = Boolean(goat.exitType || goat.exitDate || goat.exitNotes);
  const displayedBirthDate = goat.birthDate
    ? new Date(`${goat.birthDate}T00:00:00`).toLocaleDateString("pt-BR")
    : "-";

  const getStatusClass = (status?: string) => {
    const normalized = String(status ?? displayedStatus ?? "").trim().toLowerCase();

    if (normalized === "ativo" || normalized === "active") return "ativo";
    if (normalized === "inativo" || normalized === "inactive") return "inativo";
    if (normalized === "vendido" || normalized === "sold") return "vendido";
    if (
      normalized === "falecido" ||
      normalized === "morto" ||
      normalized === "deceased"
    ) {
      return "falecido";
    }

    return "";
  };

  return (
    <div className="goat-info-container">
      <div className="goat-info-header">
        <div>
          <h2 className="goat-name">Dados do animal</h2>
        </div>

        <span className={`status-badge ${getStatusClass(String(goat.status ?? displayedStatus))}`}>
          {displayedStatus}
        </span>
      </div>

      <section className="goat-info-section">
        <div className="goat-info-section__header">
          <span className="goat-info-section__eyebrow">Identificação</span>
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
            <div className="value">{displayedBirthDate}</div>
          </div>

          <div className="info-group">
            <label>Categoria</label>
            <div className="value">{displayedCategory}</div>
          </div>
        </div>
      </section>

      <section className="goat-info-section goat-info-section--secondary">
        <div className="goat-info-section__header">
          <span className="goat-info-section__eyebrow">Manejo e genealogia</span>
        </div>

        <div className="goat-info-grid goat-info-grid--secondary">
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
              {goat.fatherName || "Pai desconhecido"} /{" "}
              {goat.motherName || "Mãe desconhecida"}
            </div>
          </div>

          <div className="info-group full-width">
            <label>Fazenda</label>
            <div className="value">{goat.farmName}</div>
          </div>

          {hasExitData && (
            <div className="info-group full-width">
              <label>Saída do rebanho</label>
              <div className="value">
                {goat.exitType || "Tipo não informado"}
                {goat.exitDate ? ` • ${goat.exitDate}` : ""}
                {goat.exitNotes ? ` • ${goat.exitNotes}` : ""}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


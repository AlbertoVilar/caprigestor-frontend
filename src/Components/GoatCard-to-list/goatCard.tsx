import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { Link } from "react-router-dom";

import { statusDisplayMap } from "../../utils/Translate-Map/statusDisplayMap";
import { genderDisplayMap } from "../../utils/Translate-Map/genderDisplayMap";
import { categoryDisplayMap } from "../../utils/Translate-Map/categoryDisplayMap";
import { buildGoatDetailPath } from "../../utils/appRoutes";

import "./goatCardList.css";

import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";

interface Props {
  goat: GoatResponseDTO;
  farmOwnerId?: number;
  onEdit: (goat: GoatResponseDTO) => void;
}

export default function GoatCard({ goat, onEdit, farmOwnerId }: Props) {
  const { isAuthenticated } = useAuth();
  const permissions = usePermissions();
  const isFarmOwner = farmOwnerId != null && permissions.isOwner(Number(farmOwnerId));

  const displayedStatus = statusDisplayMap[goat.status] || goat.status;
  const displayedGender = genderDisplayMap[goat.gender] || goat.gender;
  const displayedCategory = categoryDisplayMap[goat.category] || goat.category;
  const normalizedGender = String(goat.gender ?? displayedGender ?? "").trim().toUpperCase();
  const isFemale = normalizedGender.startsWith("F");
  const genderClass = isFemale ? "feminino" : "masculino";
  const genderIcon = isFemale ? "fa-venus" : "fa-mars";
  const normalizedStatus = String(goat.status ?? displayedStatus ?? "").trim().toUpperCase();
  const isOperationallyActive = ["ATIVO", "ACTIVE"].includes(normalizedStatus);

  const canEdit = isAuthenticated && (permissions.canEditGoat(goat) || isFarmOwner);
  const canDelete = isAuthenticated && (permissions.canDeleteGoat(goat) || isFarmOwner);
  const goatRouteId = goat.id ?? goat.registrationNumber;
  const detailPath = buildGoatDetailPath(goat.farmId, goatRouteId);
  const herdColor = goat.color?.trim() || "Pelagem não informada";

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";

    const isoLike = /^\d{4}-\d{2}-\d{2}$/;
    const safeDate = isoLike.test(dateString) ? `${dateString}T00:00:00` : dateString;
    return new Date(safeDate).toLocaleDateString("pt-BR");
  };

  const exitSummary =
    goat.exitType && goat.exitDate
      ? `${goat.exitType} em ${formatDate(goat.exitDate)}`
      : goat.exitType
        ? goat.exitType
        : null;

  const getStatusClass = (status: string) => {
    const normalized = String(status ?? "").trim().toLowerCase();
    if (normalized === "ativo" || normalized === "active") return "ativo";
    if (normalized === "inativo" || normalized === "inactive") return "inativo";
    if (normalized === "vendido" || normalized === "sold") return "vendido";
    if (normalized === "falecido" || normalized === "morto" || normalized === "deceased") return "falecido";
    return "ativo";
  };

  return (
    <Link
      to={detailPath}
      state={{
        goat,
        farmId: goat.farmId,
        farmOwnerId: goat.ownerId ?? goat.userId,
      }}
      className="goat-list-card-link"
    >
      <div className="goat-list-card">
        <div className="goat-list-card__header">
          <div className="goat-list-card__identity">
            <div className="goat-list-card__title-row">
              <h3 className="goat-list-card__name">{goat.name}</h3>
              <span className={`goat-list-card__status goat-list-card__status--${getStatusClass(String(goat.status ?? displayedStatus))}`}>
                {displayedStatus}
              </span>
            </div>

            <div className="goat-list-card__chips">
              <span className="goat-list-card__chip goat-list-card__chip--register">
                <i className="fa-solid fa-id-card" aria-hidden="true"></i>
                <span>Reg: {goat.registrationNumber || "Sem registro"}</span>
              </span>
              <span className={`goat-list-card__chip goat-list-card__chip--gender goat-list-card__chip--${genderClass}`}>
                <i className={`fa-solid ${genderIcon}`} aria-hidden="true"></i>
                <span>{displayedGender}</span>
              </span>
              <span className="goat-list-card__chip goat-list-card__chip--breed">
                <i className="fa-solid fa-dna" aria-hidden="true"></i>
                <span>{goat.breed || "Raça não informada"}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="goat-list-card__grid">
          <div className="goat-list-card__info">
            <span className="goat-list-card__label">Categoria</span>
            <span className="goat-list-card__value">{displayedCategory}</span>
          </div>

          <div className="goat-list-card__info">
            <span className="goat-list-card__label">Nascimento</span>
            <span className="goat-list-card__value">{formatDate(goat.birthDate)}</span>
          </div>

          <div className="goat-list-card__info">
            <span className="goat-list-card__label">TOD</span>
            <span className="goat-list-card__value goat-list-card__value--mono">{goat.tod || "-"}</span>
          </div>

          <div className="goat-list-card__info">
            <span className="goat-list-card__label">TOE</span>
            <span className="goat-list-card__value goat-list-card__value--mono">{goat.toe || "-"}</span>
          </div>
        </div>

        <div className="goat-list-card__support">
          <span className="goat-list-card__support-pill">
            <i className="fa-solid fa-palette" aria-hidden="true"></i>
            <span>{herdColor}</span>
          </span>
          {goat.farmName && (
            <span className="goat-list-card__support-pill goat-list-card__support-pill--farm">
              <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
              <span>{goat.farmName}</span>
            </span>
          )}
          {exitSummary && (
            <span className="goat-list-card__support-pill goat-list-card__support-pill--exit">
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
              <span>{exitSummary}</span>
            </span>
          )}
        </div>

        <div className="goat-list-card__actions" onClick={(e) => e.stopPropagation()}>
          <Link
            to={detailPath}
            state={{
              goat,
              farmId: goat.farmId,
              farmOwnerId: goat.ownerId ?? goat.userId,
            }}
            className="goat-list-card__action goat-list-card__action--details"
            title="Ver detalhes"
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </Link>

          {canEdit && isFemale && isOperationallyActive && (
            <Link
              to={`/app/goatfarms/${goat.farmId}/goats/${goat.registrationNumber}/milk-productions`}
              className="goat-list-card__action goat-list-card__action--production"
              title="Registrar produção"
              onClick={(e) => e.stopPropagation()}
            >
              <i className="fa-solid fa-jug-detergent"></i>
            </Link>
          )}

          {canEdit && (
            <button
              className="goat-list-card__action goat-list-card__action--edit"
              title="Editar"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(goat);
              }}
            >
              <i className="fa-solid fa-pen"></i>
            </button>
          )}

          {canDelete && (
            <button
              className="goat-list-card__action goat-list-card__action--delete"
              title="Excluir"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

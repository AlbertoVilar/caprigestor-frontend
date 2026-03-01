// src/Components/goat-card-list/GoatCard.tsx
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { Link } from "react-router-dom";

import { statusDisplayMap } from "../../utils/Translate-Map/statusDisplayMap";
import { genderDisplayMap } from "../../utils/Translate-Map/genderDisplayMap";
import { categoryDisplayMap } from '../../utils/Translate-Map/categoryDisplayMap';
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
  const isFemale = String(goat.gender ?? "").trim().toUpperCase().startsWith("F");

  const canEdit = isAuthenticated && (permissions.canEditGoat(goat) || isFarmOwner);
  const canDelete = isAuthenticated && (permissions.canDeleteGoat(goat) || isFarmOwner);
  const goatRouteId = goat.id ?? goat.registrationNumber;
  const detailPath = buildGoatDetailPath(goat.farmId, goatRouteId);

  // Função auxiliar para formatar data curta
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    // Preserve date-only values without timezone shifts.
    const isoLike = /^\d{4}-\d{2}-\d{2}$/;
    const safeDate = isoLike.test(dateString) ? `${dateString}T00:00:00` : dateString;
    return new Date(safeDate).toLocaleDateString('pt-BR');
  };

  // Determina classe de cor do status
  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'ativo') return 'ativo';
    if (s === 'vendido') return 'vendido';
    if (s === 'falecido' || s === 'morto') return 'falecido';
    return '';
  };

  return (
    <Link
      to={detailPath}
      state={{
        goat,
        farmId: goat.farmId,
        farmOwnerId: goat.ownerId ?? goat.userId,
      }}
      className="goat-card-link"
    >
      <div className="goat-card">
        {/* Header: Nome + Status Badge */}
        <div className="card-header">
          <div className="goat-identity">
            <h3 className="goat-name">{goat.name}</h3>
            <span className="goat-register">Reg: {goat.registrationNumber || "N/A"}</span>
          </div>
          <span className={`status-badge ${getStatusClass(displayedStatus)}`}>
            {displayedStatus}
          </span>
        </div>

        {/* Grid de Informações Principais */}
        <div className="card-info-grid">
          <div className="info-item">
            <span className="info-label">Sexo</span>
            <span className="info-value">
              <i className={`fa-solid ${goat.gender === 'MALE' ? 'fa-mars' : 'fa-venus'}`} 
                 style={{ marginRight: '4px', color: goat.gender === 'MALE' ? '#3b82f6' : '#ec4899' }}></i>
              {displayedGender}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Raça</span>
            <span className="info-value">{goat.breed}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Categoria</span>
            <span className="info-value">{displayedCategory}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Nascimento</span>
            <span className="info-value">{formatDate(goat.birthDate)}</span>
          </div>
        </div>

        {/* Localização / Fazenda */}
        <div className="card-location">
          <i className="fa-solid fa-location-dot"></i>
          <span>{goat.farmName || "Fazenda não informada"}</span>
        </div>

        {/* Ações */}
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <Link 
            to={detailPath}
            state={{
              goat,
              farmId: goat.farmId,
              farmOwnerId: goat.ownerId ?? goat.userId,
            }}
            className="action-btn details" 
            title="Ver Detalhes"
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </Link>

          {/* Atalho: Registrar Produção (Fêmeas) */}
          {canEdit && isFemale && (
            <Link
              to={`/app/goatfarms/${goat.farmId}/goats/${goat.registrationNumber}/milk-productions`}
              className="action-btn production"
              title="Registrar Produção"
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#0ea5e9" }}
            >
              <i className="fa-solid fa-jug-detergent"></i>
            </Link>
          )}

          {canEdit && (
            <button
              className="action-btn edit"
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
              className="action-btn delete"
              title="Excluir"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Lógica de excluir aqui
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

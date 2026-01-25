// src/Components/goat-card-list/GoatCard.tsx
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { Link } from "react-router-dom";

import { statusDisplayMap } from "../../utils/Translate-Map/statusDisplayMap";
import { genderDisplayMap } from "../../utils/Translate-Map/genderDisplayMap";
import { categoryDisplayMap } from '../../utils/Translate-Map/categoryDisplayMap';

import "./goatCardList.css";

import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";

interface Props {
  goat: GoatResponseDTO;
  farmOwnerId?: number;
  onEdit: (goat: GoatResponseDTO) => void;
}

export default function GoatCard({ goat, onEdit }: Props) {
  const { isAuthenticated } = useAuth();
  const permissions = usePermissions();
  const isAdmin = permissions.isAdmin();
  const isOperator = permissions.isOperator();

  const displayedStatus = statusDisplayMap[goat.status] || goat.status;
  const displayedGender = genderDisplayMap[goat.gender] || goat.gender;
  const displayedCategory = categoryDisplayMap[goat.category] || goat.category;

  const canOperatorManage = isOperator;
  const canEdit = isAuthenticated && (isAdmin || canOperatorManage);
  const canDelete = isAuthenticated && isAdmin;

  // Função auxiliar para formatar data curta
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    // Assume formato YYYY-MM-DD ou similar
    return new Date(dateString).toLocaleDateString('pt-BR');
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
    <Link to="/dashboard" state={{ goat }} className="goat-card-link">
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
            to="/dashboard" 
            state={{ goat }} 
            className="action-btn details" 
            title="Ver Detalhes"
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </Link>

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
// src/Components/goat-card-list/GoatCard.tsx
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import ButtonCard from "../buttons/ButtonCard";
import { Link } from "react-router-dom";

import { statusDisplayMap } from "../../utils/Translate-Map/statusDisplayMap";
import { genderDisplayMap } from "../../utils/Translate-Map/genderDisplayMap";

import "./goatCardList.css";

import { useAuth } from "../../contexts/AuthContext";
import { RoleEnum } from "../../Models/auth";

interface Props {
  goat: GoatResponseDTO;
  onEdit: (goat: GoatResponseDTO) => void;
}

export default function GoatCard({ goat, onEdit }: Props) {
  // hooks sempre no topo
  const { isAuthenticated, tokenPayload } = useAuth();
  const roles = tokenPayload?.authorities ?? [];
  const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);
  const isOperator = roles.includes(RoleEnum.ROLE_OPERATOR);

  const displayedStatus = statusDisplayMap[goat.status] || goat.status;
  const displayedGender = genderDisplayMap[goat.gender] || goat.gender;

  // operador pode gerenciar apenas se for dono; admin sempre pode
  const resourceOwnerId = goat.ownerId;
  const canOperatorManage =
    isOperator && resourceOwnerId != null && tokenPayload?.userId === resourceOwnerId;

  const canEdit = isAuthenticated && (isAdmin || canOperatorManage);
  const canDelete = isAuthenticated && isAdmin;

  return (
    <div className="goat-card">
      <h3 className="goat-name">{goat.name}</h3>

      <span className="goat-info-line"><strong>Registro:</strong> {goat.registrationNumber}</span>
      <span className="goat-info-line"><strong>Sexo:</strong> {displayedGender}</span>
      <span className="goat-info-line"><strong>Raça:</strong> {goat.breed}</span>
      <span className="goat-info-line"><strong>Pelagem:</strong> {goat.color}</span>
      <span className="goat-info-line"><strong>Data de Nascimento:</strong> {goat.birthDate}</span>
      <span className="goat-info-line"><strong>Status:</strong> {displayedStatus}</span>
      <span className="goat-info-line"><strong>Categoria:</strong> {goat.category}</span>
      <span className="goat-info-line"><strong>TOD:</strong> {goat.tod}</span>
      <span className="goat-info-line"><strong>TOE:</strong> {goat.toe}</span>
      <span className="goat-info-line"><strong>Pai:</strong> {goat.fatherName}</span>
      <span className="goat-info-line"><strong>Mãe:</strong> {goat.motherName}</span>
      <span className="goat-info-line"><strong>Proprietário:</strong> {goat.ownerName}</span>
      <span className="goat-info-line"><strong>Fazenda:</strong> {goat.farmName}</span>

      <div className="card-buttons">
        {/* Detalhes → vai para o dashboard (eventos ficam lá) */}
        <Link to="/dashboard" state={{ goat }} className="btn-link">
          🔍 Detalhes
        </Link>

        {/* Editar: admin ou operador dono */}
        {canEdit && (
          <ButtonCard
            name="Editar"
            className="edit"
            onClick={() => onEdit(goat)}
          />
        )}

        {/* Excluir: apenas admin */}
        {canDelete && <ButtonCard name="Excluir" className="delete" />}
      </div>
    </div>
  );
}

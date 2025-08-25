import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import ButtonCard from "../buttons/ButtonCard";
import "./goatCardList.css";
import { Link } from "react-router-dom";
import { statusDisplayMap } from "../../utils/Translate-Map/statusDisplayMap";
import { genderDisplayMap } from "../../utils/Translate-Map/genderDisplayMap";

// ✅ usamos o AuthContext para saber login/roles/userId
import { useAuth } from "@/contexts/AuthContext";
import { RoleEnum } from "@/Models/auth";

interface Props {
  goat: GoatResponseDTO;
  onEdit: (goat: GoatResponseDTO) => void;
}

export default function GoatCard({ goat, onEdit }: Props) {
  const displayedStatus = statusDisplayMap[goat.status] || goat.status;
  const displayedGender = genderDisplayMap[goat.gender] || goat.gender;

  const { isAuthenticated, tokenPayload } = useAuth();
  const roles = tokenPayload?.authorities ?? [];

  const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);
  const isOperator = roles.includes(RoleEnum.ROLE_OPERATOR);

  // ⚠️ ownerId precisa vir do DTO. Se não vier no seu tipo, pegamos via any;
  // ideal é adicionar ownerId?: number no GoatResponseDTO.
  const resourceOwnerId = (goat).ownerId as number | undefined;

  // operador só pode se for dono; admin sempre pode
  const canOperatorManage =
    isOperator && resourceOwnerId != null && tokenPayload?.userId === resourceOwnerId;

  const canEdit = isAuthenticated && (isAdmin || canOperatorManage);
  const canDelete = isAuthenticated && isAdmin;
  const canSeeEvents = canEdit; // ajuste se quiser regra diferente

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
        {/* 🔍 Detalhes: público (read-only) */}
        <Link
          to="/dashboard"
          state={{ goat }}
          className="btn-link"
        >
          🔍 Detalhes
        </Link>

        {/* 📝 Eventos: somente logado & autorizado */}
        {canSeeEvents && (
          <Link
            to={`/cabras/${goat.registrationNumber}/eventos`}
            className="btn-link"
          >
            📝 Eventos
          </Link>
        )}

        {/* ✏️ Editar: somente logado & (admin || operador dono) */}
        {canEdit && (
          <ButtonCard
            name="Editar"
            className="edit"
            onClick={() => onEdit(goat)}
          />
        )}

        {/* 🗑️ Excluir: somente admin */}
        {canDelete && (
          <ButtonCard
            name="Excluir"
            className="delete"
            // TODO: conectar sua função de exclusão
          />
        )}
      </div>
    </div>
  );
}

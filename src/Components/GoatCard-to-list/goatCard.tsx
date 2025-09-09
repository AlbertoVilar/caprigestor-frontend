// src/Components/goat-card-list/GoatCard.tsx
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import ButtonCard from "../buttons/ButtonCard";
import { Link } from "react-router-dom";

import { statusDisplayMap } from "../../utils/Translate-Map/statusDisplayMap";
import { genderDisplayMap } from "../../utils/Translate-Map/genderDisplayMap";

import "./goatCardList.css";

import { usePermissions } from "../../Hooks/usePermissions";

interface Props {
  goat: GoatResponseDTO;
  farmOwnerId?: number; // ID do proprietário da fazenda (userId)
  onEdit: (goat: GoatResponseDTO) => void;
  // Sugestão: Adicionar onDelete para o componente pai gerenciar a exclusão
  // onDelete: (goatId: number) => void; 
}

export default function GoatCard({ goat, farmOwnerId, onEdit }: Props) {
  const { canManage, canDelete } = usePermissions({ farmOwnerId });



  const displayedStatus = statusDisplayMap[goat.status] || goat.status;
  const displayedGender = genderDisplayMap[goat.gender] || goat.gender;

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
      <span className="goat-info-line"><strong>Proprietário:</strong> {goat.user?.name || goat.ownerName}</span>
      <span className="goat-info-line"><strong>Fazenda:</strong> {goat.farmName}</span>

      <div className="card-buttons">
        <Link to="/dashboard" state={{ goat, farmOwnerId }} className="btn-link">
          🔍 Detalhes
        </Link>

        {/* Botão de edição: dono ou admin */}
        {canManage && (
          <ButtonCard
            name="Editar"
            className="edit"
            onClick={() => onEdit(goat)}
          />
        )}
        
        {/* Botão de exclusão: apenas admin */}
        {canDelete && (
          <ButtonCard
            name="Excluir"
            className="delete"
            // onClick={() => onDelete(goat.id)} // Exemplo de como seria a chamada
          />
        )}
      </div>
    </div>
  );
}

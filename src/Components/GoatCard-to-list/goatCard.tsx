// src/components/GoatCard-to-list/GoatCard.tsx

import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import ButtonCard from "../buttons/ButtonCard";
import "./goatCardList.css";
import { Link } from "react-router-dom";

interface Props {
  goat: GoatResponseDTO;
  onEdit: (goat: GoatResponseDTO) => void;
}

export default function GoatCard({ goat, onEdit }: Props) {
  return (
    <div className="goat-card">
      <h3 className="goat-name">{goat.name}</h3>

      <span className="goat-info-line"><strong>Registro:</strong> {goat.registrationNumber}</span>
      <span className="goat-info-line"><strong>Sexo:</strong> {goat.gender}</span>
      <span className="goat-info-line"><strong>Raça:</strong> {goat.breed}</span>
      <span className="goat-info-line"><strong>Pelagem:</strong> {goat.color}</span>
      <span className="goat-info-line"><strong>Data de Nascimento:</strong> {goat.birthDate}</span>
      <span className="goat-info-line"><strong>Status:</strong> {goat.status}</span>
      <span className="goat-info-line"><strong>Categoria:</strong> {goat.category}</span>
      <span className="goat-info-line"><strong>TOD:</strong> {goat.tod}</span>
      <span className="goat-info-line"><strong>TOE:</strong> {goat.toe}</span>
      <span className="goat-info-line"><strong>Pai:</strong> {goat.fatherName}</span>
      <span className="goat-info-line"><strong>Mãe:</strong> {goat.motherName}</span>
      <span className="goat-info-line"><strong>Proprietário:</strong> {goat.ownerName}</span>
      <span className="goat-info-line"><strong>Fazenda:</strong> {goat.farmName}</span>

      <div className="card-buttons">
        <Link
          to="/dashboard"
          state={{ goat }}
          className="btn-link"
        >
          🔍 Detalhes
        </Link>

        {/* ✅ Botão de edição ativado */}
        <ButtonCard
          name="Editar"
          className="edit"
          onClick={() => onEdit(goat)}
        />

        <ButtonCard name="Excluir" className="delete" />
      </div>
    </div>
  );
}

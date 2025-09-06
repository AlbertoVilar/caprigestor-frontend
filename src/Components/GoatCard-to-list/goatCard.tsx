// src/Components/goat-card-list/GoatCard.tsx
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import ButtonCard from "../buttons/ButtonCard";
import { Link } from "react-router-dom";

import { statusDisplayMap } from "../../utils/Translate-Map/statusDisplayMap";
import { genderDisplayMap } from "../../utils/Translate-Map/genderDisplayMap";

import "./goatCardList.css";

import { useAuth } from "../../contexts/AuthContext";
import { RoleEnum } from "../../Models/auth";
import { getOwnerByUserId } from "@/api/OwnerAPI/owners";
import { useEffect, useState } from "react";

interface Props {
  goat: GoatResponseDTO;
  farmOwnerId?: number; // Adicionar o ownerId da fazenda
  onEdit: (goat: GoatResponseDTO) => void;
  // Sugestão: Adicionar onDelete para o componente pai gerenciar a exclusão
  // onDelete: (goatId: number) => void; 
}

export default function GoatCard({ goat, farmOwnerId, onEdit }: Props) {
  const { isAuthenticated, tokenPayload } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isCheckingOwnership, setIsCheckingOwnership] = useState(true);
  
  // 1. Lógica de permissão unificada
  const roles = tokenPayload?.authorities ?? [];
  const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);

  // 2. Verificar se o usuário é proprietário através da API correta
  useEffect(() => {
    async function checkOwnership() {
      console.log(`[GoatCard API DEBUG] Iniciando verificação para cabra: ${goat.name}`);
      
      if (!tokenPayload?.userId) {
        console.log(`[GoatCard API DEBUG] Sem userId no token`);
        setIsOwner(false);
        setIsCheckingOwnership(false);
        return;
      }

      try {
        const ownerData = await getOwnerByUserId(tokenPayload.userId);
        // Verifica se o proprietário encontrado é o mesmo da fazenda (não da cabra diretamente)
        const userIsOwner = ownerData?.id === farmOwnerId;
        setIsOwner(userIsOwner);
        
        // Debug: Verificar associação correta (usando ownerId da fazenda)
        console.log("VERIFICANDO DONO (CORRIGIDO):", {
          userIdNoToken: tokenPayload?.userId,
          farmOwnerId: farmOwnerId,
          ownerDataId: ownerData?.id,
          goatName: goat.name,
          isAdmin,
          isOwner: userIsOwner,
          canManage: isAuthenticated && (isAdmin || userIsOwner)
        });
      } catch (error) {
        console.error("[GoatCard API DEBUG] Erro ao verificar propriedade da cabra:", error);
        setIsOwner(false);
      } finally {
        setIsCheckingOwnership(false);
        console.log(`[GoatCard API DEBUG] Verificação concluída para cabra: ${goat.name}`);
      }
    }

    checkOwnership();
  }, [tokenPayload?.userId, farmOwnerId, goat.name, isAdmin, isAuthenticated]);

  // A condição principal: o usuário pode gerenciar (editar, excluir, etc.)?
  // Ele precisa estar autenticado E ser (admin OU o proprietário do recurso).
  const canManage = isAuthenticated && (isAdmin || isOwner);



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
      <span className="goat-info-line"><strong>Proprietário:</strong> {goat.ownerName}</span>
      <span className="goat-info-line"><strong>Fazenda:</strong> {goat.farmName}</span>

      <div className="card-buttons">
        <Link to="/dashboard" state={{ goat, farmOwnerId }} className="btn-link">
          🔍 Detalhes
        </Link>

        {/* 2. Usando a nova variável para ambos os botões de ação */}
        {canManage && (
          <>
            <ButtonCard
              name="Editar"
              className="edit"
              onClick={() => onEdit(goat)}
            />
            <ButtonCard
              name="Excluir"
              className="delete"
              // onClick={() => onDelete(goat.id)} // Exemplo de como seria a chamada
            />
          </>
        )}
      </div>
    </div>
  );
}

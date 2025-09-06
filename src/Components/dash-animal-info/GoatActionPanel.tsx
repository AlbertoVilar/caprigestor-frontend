import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RoleEnum } from "@/Models/auth";
import { getOwnerByUserId } from "@/api/OwnerAPI/owners";
import { useEffect, useState } from "react";
import "../../index.css";
import "./animaldashboard.css";

interface Props {
  registrationNumber: string | null;
  onShowGenealogy: () => void;
  onShowEventForm: () => void;
  resourceOwnerId?: number;
}

export default function GoatActionPanel({
  registrationNumber,
  onShowGenealogy,
  onShowEventForm,
  resourceOwnerId,
}: Props) {
  const navigate = useNavigate();
  const { isAuthenticated, tokenPayload } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isCheckingOwnership, setIsCheckingOwnership] = useState(true);

  if (!registrationNumber) return null;

  // 1. Lógica de permissão unificada
  const roles = tokenPayload?.authorities ?? [];
  const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);

  // 2. Verificar se o usuário é proprietário através da API correta
  useEffect(() => {
    async function checkOwnership() {
      if (!tokenPayload?.userId || !resourceOwnerId) {
        setIsOwner(false);
        setIsCheckingOwnership(false);
        return;
      }

      try {
        const ownerData = await getOwnerByUserId(tokenPayload.userId);
        // Verifica se o proprietário encontrado é o mesmo do recurso
        const userIsOwner = ownerData?.id === resourceOwnerId;
        setIsOwner(userIsOwner);
      } catch (error) {
        console.error("Erro ao verificar propriedade do recurso:", error);
        setIsOwner(false);
      } finally {
        setIsCheckingOwnership(false);
      }
    }

    checkOwnership();
  }, [tokenPayload?.userId, resourceOwnerId]);
  
  // A condição principal para todas as ações de gerenciamento.
  const canManage = isAuthenticated && (isAdmin || isOwner);

  return (
    <div className="goat-action-panel">
      {/* Público (read-only) */}
      <button className="btn-primary" onClick={onShowGenealogy}>
        <span className="icon">🧬</span> Ver genealogia
      </button>

      {/* 2. Usando a variável 'canManage' para todas as ações restritas */}
      {canManage && (
        <>
          <button
            className="btn-primary"
            onClick={() => navigate(`/cabras/${registrationNumber}/eventos`)}
          >
            <span className="icon">📅</span> Ver eventos
          </button>

          <div className="btn-divider"></div>

          <button className="btn-primary" onClick={onShowEventForm}>
            <span className="icon">➕</span> Novo evento
          </button>
          
          <button className="btn-primary" onClick={() => onShowEventForm() /* ou handler de edição */}>
            Editar
          </button>
          
          <button
            className="btn-danger"
            onClick={() => { /* TODO: conectar ação de exclusão */ }}
          >
            Excluir
          </button>
        </>
      )}
    </div>
  );
}

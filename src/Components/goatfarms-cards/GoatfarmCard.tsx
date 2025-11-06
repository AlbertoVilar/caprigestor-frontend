import type { GoatFarmDTO } from "../../Models/goatFarm";
import ButtonCard from "../buttons/ButtonCard";
import ButtonLink from "../buttons/ButtonLink";
import { Link } from "react-router-dom";
import "./goatfarmsCards.css";

import { useAuth } from "@/contexts/AuthContext";
import { RoleEnum } from "@/Models/auth";
import { deleteGoatFarm } from "../../api/GoatFarmAPI/goatFarm";
import { toast } from "react-toastify";
import { useState } from "react";

type Props = {
  farm: GoatFarmDTO;
  onDeleted?: (farmId: number) => void;
};

export default function GoatFarmCard({ farm, onDeleted }: Props) {
  const { isAuthenticated, tokenPayload } = useAuth();
  const roles = tokenPayload?.authorities ?? [];
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);
  const isOperator = roles.includes(RoleEnum.ROLE_OPERATOR);

  // Operador só pode gerenciar se for dono da fazenda
  // Garantindo que a comparação seja feita com tipos consistentes
  const isOwnerOperator =
    isOperator && 
    tokenPayload?.userId != null && 
    Number(tokenPayload.userId) === Number(farm.userId);

  // Lógica de permissões conforme documentação RBAC
  const canEdit = isAuthenticated && (isAdmin || isOwnerOperator);
  const canDelete = isAuthenticated && (isAdmin || isOwnerOperator);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Tem certeza que deseja deletar a fazenda "${farm.name}"?\n\nEsta ação não pode ser desfeita e removerá todos os dados associados.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteGoatFarm(farm.id);
      toast.success(`Fazenda "${farm.name}" removida com sucesso!`);
      
      // Notifica o componente pai para remover da lista
      if (onDeleted) {
        onDeleted(farm.id);
      } else {
        // Se não tiver callback, recarrega a página após 1s
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = error.response?.status;

      if (status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (status === 403) {
        toast.error('Você não tem permissão para deletar esta fazenda.');
      } else if (status === 404) {
        toast.info('Fazenda não encontrada. A lista será atualizada.');
        if (onDeleted) {
          onDeleted(farm.id);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
        toast.error(`Erro ao deletar fazenda: ${errorMessage}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link to={`/cabras?farmId=${farm.id}`} className="goatfarm-card-link">
      <div className="goatfarm-card">
        <h3>{farm.name}</h3>

        <p>
          <strong>TOD:</strong> {farm.tod}
        </p>

        <p>
          <strong>Proprietário:</strong> {farm.userName}
        </p>

        <p className="address-line">
          <strong>Endereço:</strong>
          <br />
          {`${farm.street}, ${farm.district}, ${farm.city} - ${farm.state}`}
          <br />
          {`CEP: ${farm.cep}`}
        </p>

        <p>
          <strong>Telefones:</strong>{" "}
          {farm.phones?.map((phone) => (
            <span key={phone.id} className="phone-item">
              <i className="fa-solid fa-phone"></i> ({phone.ddd}) {phone.number}
            </span>
          ))}
        </p>

        {/* Ações */}
        <div className="card-buttons-farm" onClick={(e) => e.stopPropagation()}>
          {/* Detalhes: público (read-only) */}
          <ButtonLink to={`/cabras?farmId=${farm.id}`} label="🔍 Detalhes" className="btn-link" />

          {/* Editar: somente logado & (admin || operador dono) */}
          {canEdit && (
            <ButtonLink
              to={`/fazendas/${farm.id}/editar`}
              label="✏️ Editar"
              className="edit"
            />
          )}

          {/* Excluir: somente admin ou operador dono */}
          {canDelete && (
            <ButtonCard
              name={isDeleting ? "⏳ Removendo..." : "🗑️ Excluir"}
              className="delete"
              onClick={handleDelete}
              disabled={isDeleting}
            />
          )}
        </div>
      </div>
    </Link>
  );
}

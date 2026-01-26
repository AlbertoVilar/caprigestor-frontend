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
        {/* Header */}
        <div className="farm-card-header">
          <div className="farm-identity">
            <h3 className="farm-name">{farm.name}</h3>
            {farm.tod && (
              <span className="farm-tod" title="Registro TOD">
                <i className="fa-solid fa-fingerprint"></i> TOD: {farm.tod}
              </span>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="farm-info-grid">
          <div className="farm-info-item">
            <span className="farm-info-label">Proprietário</span>
            <span className="farm-info-value" title={farm.userName}>{farm.userName}</span>
          </div>
          <div className="farm-info-item">
             <span className="farm-info-label">Endereço</span>
             <span className="farm-info-value" title={`${farm.city} - ${farm.state}`}>
                {farm.city} - {farm.state}
             </span>
          </div>
        </div>

        {/* Contact Section */}
        <div className="farm-location-contact">
          {farm.phones && farm.phones.length > 0 ? (
            farm.phones.map((phone, index) => (
              <div key={index} className="contact-row">
                <i className="fa-solid fa-phone"></i>
                <span>({phone.ddd}) {phone.number}</span>
              </div>
            ))
          ) : (
             <div className="contact-row">
                <i className="fa-solid fa-phone-slash"></i>
                <span style={{fontStyle: 'italic'}}>Sem telefone</span>
             </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="farm-card-actions">
           {/* Botão de Detalhes (Sempre visível) */}
            <Link
              to={`/cabras?farmId=${farm.id}`}
              className="action-btn details"
              title="Ver Detalhes / Cabras"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </Link>

          {canEdit && (
            <Link
              to={`/fazendas/${farm.id}/editar`}
              className="action-btn edit"
              onClick={(e) => e.stopPropagation()}
              title="Editar Fazenda"
            >
              <i className="fa-solid fa-pen"></i>
            </Link>
          )}

          {canDelete && (
            <button
              className="action-btn delete"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Excluir Fazenda"
            >
              {isDeleting ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-solid fa-trash"></i>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

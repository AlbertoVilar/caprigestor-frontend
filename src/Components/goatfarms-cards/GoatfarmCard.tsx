import { useState } from "react";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { deleteGoatFarm } from "../../api/GoatFarmAPI/goatFarm";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";
import "./goatfarmsCards.css";

type Props = {
  farm: GoatFarmDTO;
  onDeleted?: (farmId: number) => void;
};

export default function GoatFarmCard({ farm, onDeleted }: Props) {
  const { isAuthenticated } = useAuth();
  const permissions = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const farmDetailsPath = `/cabras?farmId=${farm.id}`;

  const canEdit = isAuthenticated && permissions.canEditFarm(farm);
  const canDelete = isAuthenticated && permissions.canDeleteFarm(farm);

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

      if (onDeleted) {
        onDeleted(farm.id);
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const status = error.response?.status;

      if (status === 401) {
        toast.error("Sessão expirada. Faça login novamente.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else if (status === 403) {
        toast.error("Você não tem permissão para deletar esta fazenda.");
      } else if (status === 404) {
        toast.info("Fazenda não encontrada. A lista será atualizada.");
        if (onDeleted) {
          onDeleted(farm.id);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        const errorMessage =
          error.response?.data?.message || error.message || "Erro desconhecido";
        toast.error(`Erro ao deletar fazenda: ${errorMessage}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="goatfarm-card">
      <Link
        to={farmDetailsPath}
        className="goatfarm-card-link"
        aria-label={`Abrir detalhes da fazenda ${farm.name}`}
      >
        <div className="farm-card-header">
          <div className="farm-logo-container">
            {farm.logoUrl && !imageError ? (
              <img
                src={farm.logoUrl}
                alt={`Logo ${farm.name}`}
                className="farm-logo"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="farm-logo-placeholder" aria-hidden="true">
                <i className="fa-solid fa-tractor"></i>
              </div>
            )}
          </div>
          <div className="farm-identity">
            <h3 className="farm-name">{farm.name}</h3>
            {farm.tod && (
              <span className="farm-tod" title="Registro TOD">
                <i className="fa-solid fa-fingerprint" aria-hidden="true"></i> TOD: {farm.tod}
              </span>
            )}
          </div>
        </div>

        <div className="farm-info-grid">
          <div className="farm-info-item">
            <span className="farm-info-label">Proprietário</span>
            <span className="farm-info-value" title={farm.userName}>
              {farm.userName}
            </span>
          </div>
          <div className="farm-info-item">
            <span className="farm-info-label">Endereço</span>
            <span className="farm-info-value" title={`${farm.city} - ${farm.state}`}>
              {farm.city} - {farm.state}
            </span>
          </div>
        </div>

        <div className="farm-location-contact">
          {farm.phones && farm.phones.length > 0 ? (
            farm.phones.map((phone, index) => (
              <div key={index} className="contact-row">
                <i className="fa-solid fa-phone" aria-hidden="true"></i>
                <span>
                  ({phone.ddd}) {phone.number}
                </span>
              </div>
            ))
          ) : (
            <div className="contact-row">
              <i className="fa-solid fa-phone-slash" aria-hidden="true"></i>
              <span style={{ fontStyle: "italic" }}>Sem telefone</span>
            </div>
          )}
        </div>
      </Link>

      <div className="farm-card-actions">
        <Link
          to={farmDetailsPath}
          className="action-btn details"
          title="Ver detalhes da fazenda"
          aria-label={`Ver detalhes da fazenda ${farm.name}`}
        >
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        </Link>

        {canEdit && (
          <Link
            to={`/fazendas/${farm.id}/editar`}
            className="action-btn edit"
            title="Editar Fazenda"
            aria-label={`Editar fazenda ${farm.name}`}
          >
            <i className="fa-solid fa-pen" aria-hidden="true"></i>
          </Link>
        )}

        {canDelete && (
          <button
            type="button"
            className="action-btn delete"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Excluir Fazenda"
            aria-label={`Excluir fazenda ${farm.name}`}
          >
            {isDeleting ? (
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
            ) : (
              <i className="fa-solid fa-trash" aria-hidden="true"></i>
            )}
          </button>
        )}
      </div>
    </article>
  );
}

import { useState } from "react";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { deleteGoatFarm } from "../../api/GoatFarmAPI/goatFarm";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";
import { buildFarmCommercialPath, buildFarmDashboardPath, buildFarmGoatsPath } from "../../utils/appRoutes";
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
  const farmDashboardPath = buildFarmDashboardPath(farm.id);
  const farmCommercialPath = buildFarmCommercialPath(farm.id);
  const farmGoatsPath = buildFarmGoatsPath(farm.id);
  const farmReportsPath = `/app/goatfarms/${farm.id}/reports`;
  const farmAddress = [farm.city, farm.state].filter(Boolean).join(" - ");
  const ownerName = farm.userName || farm.ownerName || "Não informado";

  const canEdit = isAuthenticated && permissions.canEditFarm(farm);
  const canDelete = isAuthenticated && permissions.canDeleteFarm(farm);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a fazenda "${farm.name}"?\n\nEsta ação não pode ser desfeita e removerá todos os dados associados.`
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
        toast.error("Você não tem permissão para excluir esta fazenda.");
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
        const errorMessage = error.response?.data?.message || error.message || "Erro desconhecido";
        toast.error(`Erro ao deletar fazenda: ${errorMessage}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="goatfarm-card">
      <Link
        to={farmDashboardPath}
        className="goatfarm-card-link"
        aria-label={`Abrir dashboard da fazenda ${farm.name}`}
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
            <div className="farm-identity-top">
              <h3 className="farm-name">{farm.name}</h3>
              {farm.tod && (
                <span className="farm-tod" title="Registro TOD">
                  <i className="fa-solid fa-fingerprint" aria-hidden="true"></i>
                  TOD {farm.tod}
                </span>
              )}
            </div>

            <div className="farm-identity-meta">
              <span className="farm-identity-chip">
                <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                {farmAddress || "Endereço não informado"}
              </span>
              <span className="farm-identity-chip farm-identity-chip--owner">
                <i className="fa-solid fa-user" aria-hidden="true"></i>
                {ownerName}
              </span>
            </div>
          </div>
        </div>

        <div className="farm-info-grid">
          <div className="farm-info-item">
            <span className="farm-info-label">Proprietário</span>
            <span className="farm-info-value" title={ownerName}>
              {ownerName}
            </span>
          </div>
          <div className="farm-info-item">
            <span className="farm-info-label">Endereço</span>
            <span className="farm-info-value" title={farmAddress}>
              {farmAddress || "Não informado"}
            </span>
          </div>
        </div>

        <div className="farm-location-contact">
          <span className="farm-contact-title">Contato da fazenda</span>
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
              <span style={{ fontStyle: "italic" }}>Sem telefone cadastrado</span>
            </div>
          )}
        </div>
      </Link>

      <div className="farm-card-actions">
        <Link
          to={farmDashboardPath}
          className="action-btn details"
          title="Abrir dashboard da fazenda"
          aria-label={`Abrir dashboard da fazenda ${farm.name}`}
        >
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        </Link>

        <Link
          to={farmGoatsPath}
          className="action-btn herd"
          title="Abrir rebanho da fazenda"
          aria-label={`Abrir rebanho da fazenda ${farm.name}`}
        >
          <i className="fa-solid fa-cow" aria-hidden="true"></i>
        </Link>

        <Link
          to={farmReportsPath}
          className="action-btn details"
          title="Abrir relatórios da fazenda"
          aria-label={`Abrir relatórios da fazenda ${farm.name}`}
        >
          <i className="fa-solid fa-chart-line" aria-hidden="true"></i>
        </Link>

        <Link
          to={farmCommercialPath}
          className="action-btn action-btn--commercial"
          title="Abrir comercial da fazenda"
          aria-label={`Abrir comercial da fazenda ${farm.name}`}
        >
          <i className="fa-solid fa-handshake" aria-hidden="true"></i>
          <span>Comercial</span>
        </Link>

        {canEdit && (
          <Link
            to={`/fazendas/${farm.id}/editar`}
            className="action-btn edit"
            title="Editar fazenda"
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
            title="Excluir fazenda"
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

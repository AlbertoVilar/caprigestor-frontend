import { useNavigate } from "react-router-dom";
import { useFarmAlerts } from "../../contexts/alerts/FarmAlertsContext";
import "./AlertCenter.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  farmId: number;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function getCategoryDescription(providerKey: string, count: number): string {
  if (providerKey === "lactation_drying") {
    return `${count} cabra(s) com secagem pendente`;
  }

  if (providerKey === "reproduction_pregnancy_diagnosis") {
    return `${count} diagnostico(s) de prenhez pendente(s)`;
  }

  return `${count} alerta(s) pendente(s)`;
}

export default function AlertCenterDrawer({ isOpen, onClose, farmId }: Props) {
  const { providerStates, totalCount, getProvider, refreshAlerts } = useFarmAlerts();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <>
      <div className="alert-drawer-overlay" onClick={onClose}></div>
      <div className="alert-drawer" role="dialog" aria-modal="true" aria-label="Alertas da Fazenda">
        <div className="alert-drawer-header">
          <h3>Alertas da Fazenda</h3>
          <button className="close-btn" onClick={onClose} aria-label="Fechar alertas">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div className="alert-drawer-content">
          {totalCount === 0 ? (
            <div className="alert-drawer-empty">
              <i className="fa-solid fa-check-circle"></i>
              <p>Nenhum alerta pendente.</p>
            </div>
          ) : (
            <div className="alert-list">
              {providerStates.map((state) => {
                const provider = getProvider(state.providerKey);
                if (!provider) return null;

                return (
                  <div key={state.providerKey} className="alert-item">
                    <div className="alert-item-header">
                      <span className="alert-item-title">{provider.label}</span>
                      <span className="alert-item-badge">{state.summary.count}</span>
                    </div>

                    {state.loading ? (
                      <p className="alert-item-subtext">Carregando...</p>
                    ) : state.error ? (
                      <div className="alert-item-error">
                        <span>Falha ao carregar.</span>
                        <button
                          className="btn-link p-0"
                          onClick={(event) => {
                            event.stopPropagation();
                            refreshAlerts();
                          }}
                        >
                          Tentar novamente
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="alert-item-subtext">
                          {getCategoryDescription(state.providerKey, state.summary.count)}
                        </p>

                        {state.summary.headline && (
                          <p className="alert-item-headline">
                            <i className="fa-solid fa-circle-exclamation me-1"></i>
                            {state.summary.headline}
                          </p>
                        )}

                        {state.providerKey === "lactation_drying" &&
                          state.summary.previewItems &&
                          state.summary.previewItems.length > 0 && (
                            <div className="alert-preview-list">
                              {state.summary.previewItems.map((item) => (
                                <div key={item.id} className="alert-preview-row">
                                  <span className="preview-goat">{item.goatId ?? item.title}</span>
                                  <span className="preview-date">{formatDate(item.dryOffDate)}</span>
                                  <span
                                    className={`preview-overdue ${
                                      (item.daysOverdue ?? 0) > 0 ? "is-overdue" : ""
                                    }`}
                                  >
                                    {(item.daysOverdue ?? 0) > 0
                                      ? `+${item.daysOverdue}d`
                                      : "hoje"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                      </>
                    )}

                    <button
                      className="alert-item-action-btn"
                      onClick={() => {
                        navigate(provider.getRoute(farmId));
                        onClose();
                      }}
                    >
                      <span>Ver detalhes</span>
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="alert-drawer-footer">
          <button
            className="btn-link"
            onClick={() => {
              navigate(`/app/goatfarms/${farmId}/alerts`);
              onClose();
            }}
          >
            Ver todos os alertas
          </button>
        </div>
      </div>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { Button, EmptyState, LoadingState, Modal } from "../../Components/ui";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { dryLactation, getActiveLactation, getLactationSummary } from "../../api/GoatFarmAPI/lactation";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { usePermissions } from "../../Hooks/usePermissions";
import type { LactationResponseDTO, LactationSummaryDTO } from "../../Models/LactationDTOs";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import "./lactationPages.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
};

export default function LactationActivePage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [lactation, setLactation] = useState<LactationResponseDTO | null>(null);
  const [lactationSummary, setLactationSummary] = useState<LactationSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDryModal, setShowDryModal] = useState(false);
  const [dryDate, setDryDate] = useState("");
  const [dryError, setDryError] = useState<string | null>(null);

  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const { canManageLactation } = useFarmPermissions(farmIdNumber);
  const canManage = permissions.isAdmin() || canManageLactation;

  useEffect(() => {
    const load = async () => {
      if (!farmId || !goatId) return;
      try {
        setLoading(true);
        const [goatData, active] = await Promise.all([
          fetchGoatById(farmIdNumber, goatId),
          getActiveLactation(farmIdNumber, goatId),
        ]);
        setGoat(goatData);
        setLactation(active);
        if (active) {
          const summary = await getLactationSummary(farmIdNumber, goatId, active.id);
          setLactationSummary(summary);
        } else {
          setLactationSummary(null);
        }
      } catch (error) {
        console.error("Erro ao carregar lactação ativa", error);
        toast.error("Erro ao carregar lactação ativa");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [farmId, farmIdNumber, goatId]);

  const handleDry = async () => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (!lactation) return;
    if (!dryDate) {
      setDryError("Informe a data de secagem.");
      return;
    }
    try {
      setDryError(null);
      await dryLactation(farmIdNumber, goatId!, lactation.id, { endDate: dryDate });
      toast.success("Lactação encerrada com sucesso");
      setShowDryModal(false);
      setDryDate("");
      const updated = await getActiveLactation(farmIdNumber, goatId!);
      setLactation(updated);
      if (updated) {
        const summary = await getLactationSummary(farmIdNumber, goatId!, updated.id);
        setLactationSummary(summary);
      } else {
        setLactationSummary(null);
      }
    } catch (error) {
      console.error("Erro ao secar lactação", error);
      const parsed = parseApiError(error);
      const message = getApiErrorMessage(parsed);
      setDryError(message);
      toast.error(message);
    }
  };

  if (loading) {
    return <LoadingState label="Carregando lactação ativa..." />;
  }

  const recommendedDryOffDate = lactationSummary?.pregnancy?.recommendedDryOffDate ?? null;
  const dryOffRecommendation = Boolean(lactationSummary?.pregnancy?.dryOffRecommendation);
  const dryOffMessage = lactationSummary?.pregnancy?.message ?? null;

  const dryOffDaysDelta = recommendedDryOffDate
    ? Math.floor(
        (new Date(`${recommendedDryOffDate}T00:00:00`).getTime() -
          new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const dryOffTimingText =
    dryOffDaysDelta == null
      ? null
      : dryOffDaysDelta > 0
      ? `Faltam ${dryOffDaysDelta} dia(s) para a secagem recomendada.`
      : dryOffDaysDelta < 0
      ? `Secagem atrasada em ${Math.abs(dryOffDaysDelta)} dia(s).`
      : "Secagem recomendada para hoje.";

  return (
    <div className="module-page lactation-page">
      <section className="lactation-page__hero">
        <PageHeader
          title="Lactação ativa"
          subtitle={`Registro: ${goatId} · Fazenda · Cabra`}
          showBackButton
          backTo={`/app/goatfarms/${farmId}/goats/${goatId}/lactations`}
          actions={
            <div className="lactation-page__actions">
              {lactation && (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/app/goatfarms/${farmId}/goats/${goatId}/lactations/${lactation.id}/summary`
                    )
                  }
                >
                  <i className="fa-solid fa-chart-line" aria-hidden="true"></i> Ver sumário
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)}
              >
                <i className="fa-solid fa-jug-detergent" aria-hidden="true"></i> Produção de leite
              </Button>
            </div>
          }
        />
      </section>

      {!lactation ? (
        <EmptyState
          title="Nenhuma lactação ativa"
          description="Este animal ainda não possui uma lactação em andamento."
        />
      ) : (
        <>
          <section className="lactation-panel-grid">
            <div className="lactation-panel lactation-panel--soft">
              <span className="lactation-panel__eyebrow">Situação atual</span>
              <h3 className="lactation-panel__title">Lactação em andamento</h3>
              <p className="lactation-panel__description">
                Acompanhe o ciclo atual e use a secagem quando a cabra for retirada da produção.
              </p>
              <div className="lactation-panel__meta">
                <div className="lactation-panel__meta-card">
                  <span className="lactation-panel__meta-label">Animal</span>
                  <p className="lactation-panel__meta-value">{goat?.name || goatId}</p>
                </div>
                <div className="lactation-panel__meta-card">
                  <span className="lactation-panel__meta-label">Início</span>
                  <p className="lactation-panel__meta-value">{formatDate(lactation.startDate)}</p>
                </div>
                <div className="lactation-panel__meta-card">
                  <span className="lactation-panel__meta-label">Secagem prevista</span>
                  <p className="lactation-panel__meta-value">{formatDate(lactation.dryStartDate)}</p>
                </div>
              </div>
            </div>

            <div className="lactation-panel">
              <div className="lactation-panel__stack">
                <h3 className="lactation-panel__section-title">Ações rápidas</h3>
                <span className="lactation-status-badge lactation-status-badge--active">
                  <i className="fa-solid fa-circle" aria-hidden="true"></i> Ativa
                </span>
                <div className="lactation-panel__action-group">
                  <Button
                    variant="warning"
                    onClick={() => {
                      if (!canManage) return;
                      setShowDryModal(true);
                    }}
                    disabled={!canManage}
                    title={!canManage ? "Sem permissão para encerrar a lactação." : ""}
                  >
                    <i className="fa-solid fa-stop" aria-hidden="true"></i> Realizar secagem
                  </Button>
                </div>
                <div className="lactation-note-card">
                  <p>
                    A lactação ativa é usada como referência para os registros diários de produção
                    de leite deste animal.
                  </p>
                </div>
                {recommendedDryOffDate && (
                  <div
                    className={`lactation-note-card ${
                      dryOffRecommendation ? "lactation-note-card--warning" : ""
                    }`}
                  >
                    <p>
                      <strong>Secagem recomendada:</strong> {formatDate(recommendedDryOffDate)}
                    </p>
                    {dryOffTimingText && <p>{dryOffTimingText}</p>}
                    {dryOffMessage && <p>{dryOffMessage}</p>}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="lactation-detail-grid">
            <div className="lactation-detail-card">
              <h4>Início da gestação</h4>
              <p>{formatDate(lactation.pregnancyStartDate)}</p>
            </div>
            <div className="lactation-detail-card">
              <h4>Início da secagem</h4>
              <p>{formatDate(lactation.dryStartDate)}</p>
            </div>
          </section>
        </>
      )}

      <Modal
        open={showDryModal}
        onClose={() => setShowDryModal(false)}
        title="Encerrar lactação"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDryModal(false)}>
              Cancelar
            </Button>
            <Button variant="warning" onClick={handleDry} disabled={!canManage}>
              Confirmar secagem
            </Button>
          </>
        }
      >
        <p>Esta ação encerra a lactação e não pode ser desfeita.</p>
        <div className="lm-form-group">
          <label htmlFor="dry-date-active">Data de secagem</label>
          <input
            id="dry-date-active"
            type="date"
            value={dryDate}
            onChange={(e) => {
              setDryDate(e.target.value);
              setDryError(null);
            }}
            disabled={!canManage}
          />
          {dryError && <p className="text-danger">{dryError}</p>}
        </div>
      </Modal>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { Button, EmptyState, LoadingState } from "../../Components/ui";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { getLactationSummary } from "../../api/GoatFarmAPI/lactation";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { usePermissions } from "../../Hooks/usePermissions";
import type { LactationSummaryDTO } from "../../Models/LactationDTOs";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import "./lactationPages.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
};

const formatVolume = (volume?: number | null) => {
  if (volume === null || volume === undefined) return "-";
  const num = Number(volume);
  if (Number.isNaN(num)) return "-";
  return `${num.toFixed(2)} L`;
};

const getDurationInDays = (startDateStr?: string | null, endDateStr?: string | null) => {
  if (!startDateStr) return 0;
  const start = new Date(`${startDateStr}T00:00:00`);
  const end = endDateStr ? new Date(`${endDateStr}T00:00:00`) : new Date();
  const diffTime = end.getTime() - start.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : 0;
};

export default function LactationSummaryPage() {
  const { farmId, goatId, lactationId } = useParams<{
    farmId: string;
    goatId: string;
    lactationId: string;
  }>();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [summary, setSummary] = useState<LactationSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const lactationIdNumber = useMemo(() => Number(lactationId), [lactationId]);
  const { canManageLactation } = useFarmPermissions(farmIdNumber);
  const canManage = permissions.isAdmin() || canManageLactation;

  const daysInLactation = useMemo(
    () => getDurationInDays(summary?.lactation?.startDate, summary?.lactation?.endDate),
    [summary]
  );

  useEffect(() => {
    const load = async () => {
      if (!farmId || !goatId || !lactationId) {
        setLoading(false);
        setErrorMessage("Parâmetros inválidos para o sumário.");
        return;
      }
      try {
        setLoading(true);
        setErrorMessage(null);
        const [goatData, summaryData] = await Promise.all([
          fetchGoatById(farmIdNumber, goatId),
          getLactationSummary(farmIdNumber, goatId, lactationIdNumber),
        ]);
        setGoat(goatData);
        setSummary(summaryData);
      } catch (error) {
        const parsed = parseApiError(error);
        setErrorMessage(getApiErrorMessage(parsed));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [farmId, farmIdNumber, goatId, lactationId, lactationIdNumber]);

  const noProduction =
    summary?.production?.daysMeasured === 0 || summary?.production?.totalLiters === 0;

  if (loading) {
    return <LoadingState label="Carregando sumário da lactação..." />;
  }

  if (errorMessage) {
    return <EmptyState title="Não foi possível carregar o sumário" description={errorMessage} />;
  }

  if (!summary) {
    return (
      <EmptyState
        title="Sumário indisponível"
        description="Este ciclo não possui dados suficientes para exibir o resumo agora."
      />
    );
  }

  return (
    <div className="module-page lactation-page">
      <section className="lactation-page__hero">
        <PageHeader
          title="Sumário da lactação"
          subtitle={`${goat?.name || goatId} · Registro ${goatId} · Fazenda · Cabra`}
          showBackButton
          backTo={`/app/goatfarms/${farmId}/goats/${goatId}/lactations/${lactationId}`}
          actions={
            <div className="lactation-page__actions">
              <Button
                variant="outline"
                onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)}
              >
                <i className="fa-solid fa-jug-detergent" aria-hidden="true"></i> Produção de leite
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/lactations/${lactationId}`)}
              >
                <i className="fa-solid fa-circle-nodes" aria-hidden="true"></i> Detalhes da lactação
              </Button>
              {canManage && (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)}
                >
                  <i className="fa-solid fa-plus" aria-hidden="true"></i> Registrar produção
                </Button>
              )}
            </div>
          }
        />
      </section>

      {summary.pregnancy?.dryOffRecommendation && (
        <div className="lactation-note-card lactation-note-card--warning">
          <p>
            <strong>
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Recomendação:
            </strong>{" "}
            {summary.pregnancy.message || "Considere realizar a secagem desta lactação."}
          </p>
          {summary.pregnancy.recommendedDryOffDate && (
            <p>Data sugerida: {formatDate(summary.pregnancy.recommendedDryOffDate)}</p>
          )}
          {canManage && (
            <div
              className="lactation-page__actions"
              style={{ marginTop: "1rem", justifyContent: "flex-start" }}
            >
              <Button
                variant="warning"
                onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/lactations/active`)}
              >
                Secar lactação agora
              </Button>
            </div>
          )}
        </div>
      )}

      {noProduction ? (
        <EmptyState
          title="Nenhuma produção registrada"
          description="Esta lactação ainda não possui registros de produção de leite."
          actionLabel={canManage ? "Registrar produção" : undefined}
          onAction={
            canManage
              ? () => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)
              : undefined
          }
        />
      ) : (
        <section className="lactation-detail-grid">
          <div className="lactation-detail-card">
            <h4>Total</h4>
            <p>{formatVolume(summary.production.totalLiters)}</p>
          </div>
          <div className="lactation-detail-card">
            <h4>Média por dia</h4>
            <p>{formatVolume(summary.production.averagePerDay)}</p>
          </div>
          <div className="lactation-detail-card">
            <h4>Dias medidos</h4>
            <p>{summary.production.daysMeasured}</p>
          </div>
          <div className="lactation-detail-card">
            <h4>Pico</h4>
            <p>
              {formatVolume(summary.production.peakLiters)}
              {summary.production.peakDate ? ` · ${formatDate(summary.production.peakDate)}` : ""}
            </p>
          </div>
          <div className="lactation-detail-card">
            <h4>Início</h4>
            <p>{formatDate(summary.lactation.startDate)}</p>
          </div>
          <div className="lactation-detail-card">
            <h4>Tempo de lactação</h4>
            <div className="lactation-detail-card__stack">
              <span>{daysInLactation} dias</span>
              <span
                className={`lactation-status-badge ${
                  summary.lactation.status === "ACTIVE"
                    ? "lactation-status-badge--active"
                    : "lactation-status-badge--closed"
                }`}
              >
                <i className="fa-solid fa-circle" aria-hidden="true"></i>
                {summary.lactation.status === "ACTIVE" ? "Em andamento" : "Encerrada"}
              </span>
            </div>
          </div>
          {summary.lactation.endDate && (
            <div className="lactation-detail-card">
              <h4>Encerramento</h4>
              <p>{formatDate(summary.lactation.endDate)}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}


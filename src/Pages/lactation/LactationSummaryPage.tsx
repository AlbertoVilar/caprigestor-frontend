import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchGoatByFarmAndRegistration } from "../../api/GoatAPI/goat";
import { getLactationSummary } from "../../api/GoatFarmAPI/lactation";
import { usePermissions } from "../../Hooks/usePermissions";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { LactationSummaryDTO } from "../../Models/LactationDTOs";
import "./lactationPages.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString();
};

const formatVolume = (volume?: number | null) => {
  if (volume === null || volume === undefined) return "-";
  const num = Number(volume);
  if (Number.isNaN(num)) return "-";
  return `${num.toFixed(2)} L`;
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
  const { canCreateGoat } = useFarmPermissions(farmIdNumber);
  const canManage = permissions.isAdmin() || canCreateGoat;

  useEffect(() => {
    const load = async () => {
      if (!farmId || !goatId || !lactationId) return;
      try {
        setLoading(true);
        setErrorMessage(null);
        const [goatData, summaryData] = await Promise.all([
          fetchGoatByFarmAndRegistration(farmIdNumber, goatId),
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
    load();
  }, [farmId, farmIdNumber, goatId, lactationId, lactationIdNumber]);

  const noProduction =
    summary?.production?.daysMeasured === 0 ||
    summary?.production?.totalLiters === 0;

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
      </div>
    );
  }

  if (errorMessage) {
    return <div className="module-empty">{errorMessage}</div>;
  }

  if (!summary) {
    return <div className="module-empty">Resumo de lactação indisponível.</div>;
  }

  return (
    <div className="module-page">
      <section className="module-hero">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <h2>Sumário da lactação</h2>
        <p className="text-muted">Fazenda · Cabra · Lactação</p>
        <p>
          Animal: <strong>{goat?.name || goatId}</strong> · Registro {goatId}
        </p>
        <div className="module-actions">
          <button
            className="btn-outline"
            onClick={() =>
              navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)
            }
          >
            <i className="fa-solid fa-jug-detergent"></i> Produção de leite
          </button>
          <button
            className="btn-outline"
            onClick={() =>
              navigate(`/app/goatfarms/${farmId}/goats/${goatId}/lactations/${lactationId}`)
            }
          >
            <i className="fa-solid fa-circle-nodes"></i> Detalhes da lactação
          </button>
          {canManage && (
            <button
              className="btn-primary"
              onClick={() =>
                navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)
              }
            >
              <i className="fa-solid fa-plus"></i> Registrar produção
            </button>
          )}
        </div>
      </section>

      {summary.pregnancy?.dryOffRecommendation && (
        <div className="notes-card">
          <p>
            <strong>Recomendação:</strong>{" "}
            {summary.pregnancy.message ||
              "Considere realizar a secagem desta lactação."}
          </p>
          {summary.pregnancy.recommendedDryOffDate && (
            <p>Data sugerida: {formatDate(summary.pregnancy.recommendedDryOffDate)}</p>
          )}
          {canManage && (
            <div className="module-actions">
              <button
                className="btn-warning"
                onClick={() =>
                  navigate(`/app/goatfarms/${farmId}/goats/${goatId}/lactations/active`)
                }
              >
                Secar lactação
              </button>
            </div>
          )}
        </div>
      )}

      {noProduction ? (
        <div className="module-empty">
          Nenhuma produção registrada para esta lactação.
          <div className="module-actions" style={{ justifyContent: "center" }}>
            <button
              className="btn-primary"
              onClick={() =>
                navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)
              }
            >
              Registrar produção
            </button>
          </div>
        </div>
      ) : (
        <div className="detail-grid">
          <div className="detail-card">
            <h4>Total</h4>
            <p>{formatVolume(summary.production.totalLiters)}</p>
          </div>
          <div className="detail-card">
            <h4>Média/dia</h4>
            <p>{formatVolume(summary.production.averagePerDay)}</p>
          </div>
          <div className="detail-card">
            <h4>Dias medidos</h4>
            <p>{summary.production.daysMeasured}</p>
          </div>
          <div className="detail-card">
            <h4>Pico</h4>
            <p>
              {formatVolume(summary.production.peakLiters)}
              {summary.production.peakDate ? ` · ${formatDate(summary.production.peakDate)}` : ""}
            </p>
          </div>
          <div className="detail-card">
            <h4>Período</h4>
            <p>
              {formatDate(summary.lactation.startDate)} ·{" "}
              {summary.lactation.endDate ? formatDate(summary.lactation.endDate) : "Ativa"}
            </p>
          </div>
          <div className="detail-card">
            <h4>Status</h4>
            <span
              className={`status-badge ${
                summary.lactation.status === "ACTIVE" ? "status-active" : "status-closed"
              }`}
            >
              <i className="fa-solid fa-circle"></i>
              {summary.lactation.status === "ACTIVE" ? "Ativa" : "Encerrada"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

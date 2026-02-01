import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { dryLactation, getActiveLactation } from "../../api/GoatFarmAPI/lactation";
import { usePermissions } from "../../Hooks/usePermissions";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { LactationResponseDTO } from "../../Models/LactationDTOs";
import "./lactationPages.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString();
};

export default function LactationActivePage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [lactation, setLactation] = useState<LactationResponseDTO | null>(null);
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
      } catch (error) {
        console.error("Erro ao carregar lactação ativa", error);
        toast.error("Erro ao carregar lactação ativa");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [farmId, farmIdNumber, goatId]);

  const handleDry = async () => {
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
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
    } catch (error) {
      console.error("Erro ao secar lactação", error);
      const parsed = parseApiError(error);
      const message = getApiErrorMessage(parsed);
      setDryError(message);
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
      </div>
    );
  }

  return (
    <div className="module-page">
      <section className="module-hero">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <h2>Lactação ativa</h2>
        <p className="text-muted">Fazenda · Cabra · Lactação</p>
        <p>
          Animal: <strong>{goat?.name || goatId}</strong> · Registro {goatId}
        </p>
        <div className="module-actions">
          {lactation && (
            <button
              className="btn-outline"
              onClick={() =>
                navigate(
                  `/app/goatfarms/${farmId}/goats/${goatId}/lactations/${lactation.id}/summary`
                )
              }
            >
              <i className="fa-solid fa-chart-line"></i> Ver sumário
            </button>
          )}
          <button
            className="btn-outline"
            onClick={() =>
              navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)
            }
          >
            <i className="fa-solid fa-jug-detergent"></i> Produção de leite
          </button>
          {lactation && (
            <button
              className="btn-warning"
              disabled={!canManage}
              title={!canManage ? "Sem permissao para secar lactacao" : ""}
              onClick={() => {
                if (!canManage) return;
                setShowDryModal(true);
              }}
            >
              <i className="fa-solid fa-stop"></i> Realizar secagem
            </button>
          )}
        </div>
      </section>

      {!lactation ? (
        <div className="module-empty">
          Não há lactação ativa registrada para este animal.
        </div>
      ) : (
        <>
          <div className="detail-grid">
            <div className="detail-card">
              <h4>Status</h4>
              <span className="status-badge status-active">
                <i className="fa-solid fa-circle"></i> Ativa
              </span>
            </div>
            <div className="detail-card">
              <h4>Início</h4>
              <p>{formatDate(lactation.startDate)}</p>
            </div>
            <div className="detail-card">
              <h4>Início da gestação</h4>
              <p>{formatDate(lactation.pregnancyStartDate)}</p>
            </div>
            <div className="detail-card">
              <h4>Início da secagem</h4>
              <p>{formatDate(lactation.dryStartDate)}</p>
            </div>
          </div>
          <div className="notes-card">
            <p>
              A lactação ativa é usada como referência para registros de produção
              diária. Use o botão de secagem quando a cabra for retirada do ciclo
              produtivo.
            </p>
          </div>
        </>
      )}

      {showDryModal && (
        <div className="lm-modal-overlay">
          <div className="lm-modal-content">
            <h3>Encerrar lactação</h3>
            <p>Esta ação encerra a lactação e não pode ser desfeita.</p>
            <div className="lm-form-group">
              <label>Data de secagem</label>
              <input
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
            <div className="lm-modal-actions">
              <button className="btn-secondary" onClick={() => setShowDryModal(false)}>
                Cancelar
              </button>
              <button className="btn-warning" onClick={handleDry} disabled={!canManage}>
                Confirmar secagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

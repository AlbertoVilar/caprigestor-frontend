import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchGoatByFarmAndRegistration } from "../../api/GoatAPI/goat";
import { dryLactation, getLactationById } from "../../api/GoatFarmAPI/lactation";
import { usePermissions } from "../../Hooks/usePermissions";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { LactationResponseDTO } from "../../Models/LactationDTOs";
import "./lactationPages.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString();
};

export default function LactationDetailPage() {
  const { farmId, goatId, lactationId } = useParams<{
    farmId: string;
    goatId: string;
    lactationId: string;
  }>();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [lactation, setLactation] = useState<LactationResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDryModal, setShowDryModal] = useState(false);
  const [dryDate, setDryDate] = useState("");

  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const lactationIdNumber = useMemo(() => Number(lactationId), [lactationId]);
  const { canCreateGoat } = useFarmPermissions(farmIdNumber);
  const canManage = permissions.isAdmin() || canCreateGoat;

  useEffect(() => {
    const load = async () => {
      if (!farmId || !goatId || !lactationId) return;
      try {
        setLoading(true);
        const [goatData, lactationData] = await Promise.all([
          fetchGoatByFarmAndRegistration(farmIdNumber, goatId),
          getLactationById(farmIdNumber, goatId, lactationIdNumber),
        ]);
        setGoat(goatData);
        setLactation(lactationData);
      } catch (error) {
        console.error("Erro ao carregar lactação", error);
        toast.error("Erro ao carregar detalhes da lactação");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [farmId, farmIdNumber, goatId, lactationId, lactationIdNumber]);

  const handleDry = async () => {
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
      return;
    }
    if (!lactation || !dryDate) {
      toast.warning("Informe a data de secagem");
      return;
    }
    try {
      await dryLactation(farmIdNumber, goatId!, lactation.id, { endDate: dryDate });
      toast.success("Lactação encerrada com sucesso");
      setShowDryModal(false);
      setDryDate("");
      const updated = await getLactationById(farmIdNumber, goatId!, lactation.id);
      setLactation(updated);
    } catch (error) {
      console.error("Erro ao encerrar lactação", error);
      toast.error("Erro ao encerrar lactação");
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
      </div>
    );
  }

  if (!lactation) {
    return (
      <div className="module-empty">
        Nenhuma lactação encontrada para o identificador informado.
      </div>
    );
  }

  return (
    <div className="module-page">
      <section className="module-hero">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <h2>Detalhes da lactação</h2>
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
          {lactation.status === "ACTIVE" && (
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

      <div className="detail-grid">
        <div className="detail-card">
          <h4>Status</h4>
          <span
            className={`status-badge ${
              lactation.status === "ACTIVE" ? "status-active" : "status-closed"
            }`}
          >
            <i className="fa-solid fa-circle"></i>
            {lactation.status === "ACTIVE" ? "Ativa" : "Encerrada"}
          </span>
        </div>
        <div className="detail-card">
          <h4>Início</h4>
          <p>{formatDate(lactation.startDate)}</p>
        </div>
        <div className="detail-card">
          <h4>Fim / Secagem</h4>
          <p>{formatDate(lactation.endDate)}</p>
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

      {lactation.status !== "ACTIVE" && (
        <div className="notes-card">
          <p>
            Lactação encerrada. Consulte a produção de leite associada e o
            histórico reprodutivo para análises completas.
          </p>
        </div>
      )}

      {showDryModal && (
        <div className="lm-modal-overlay">
          <div className="lm-modal-content">
            <h3>Encerrar lactação</h3>
            <p>Informe a data de secagem para fechar o ciclo.</p>
            <div className="lm-form-group">
              <label>Data de secagem</label>
              <input
                type="date"
                value={dryDate}
                onChange={(e) => setDryDate(e.target.value)}
                disabled={!canManage}
              />
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

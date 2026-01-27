import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchGoatByFarmAndRegistration } from "../../api/GoatAPI/goat";
import { closePregnancy, getPregnancyById } from "../../api/GoatFarmAPI/reproduction";
import { usePermissions } from "../../Hooks/usePermissions";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type {
  PregnancyCloseReason,
  PregnancyCloseRequestDTO,
  PregnancyResponseDTO,
} from "../../Models/ReproductionDTOs";
import "./reproductionPages.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString();
};

const closeReasonOptions: { value: PregnancyCloseReason; label: string }[] = [
  { value: "BIRTH", label: "Parto" },
  { value: "ABORTION", label: "Aborto" },
  { value: "LOSS", label: "Perda" },
  { value: "OTHER", label: "Outro" },
  { value: "DATA_FIX_DUPLICATED_ACTIVE", label: "Correção de dados" },
];

export default function PregnancyDetailPage() {
  const { farmId, goatId, pregnancyId } = useParams<{
    farmId: string;
    goatId: string;
    pregnancyId: string;
  }>();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [pregnancy, setPregnancy] = useState<PregnancyResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeForm, setCloseForm] = useState<PregnancyCloseRequestDTO>({
    closeDate: "",
    status: "CLOSED",
    closeReason: "BIRTH",
    notes: "",
  });

  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const pregnancyIdNumber = useMemo(() => Number(pregnancyId), [pregnancyId]);
  const { canCreateGoat } = useFarmPermissions(farmIdNumber);
  const canManage = permissions.isAdmin() || canCreateGoat;

  const loadData = async () => {
    if (!farmId || !goatId || !pregnancyId) return;
    try {
      setLoading(true);
      const [goatData, pregnancyData] = await Promise.all([
        fetchGoatByFarmAndRegistration(farmIdNumber, goatId),
        getPregnancyById(farmIdNumber, goatId, pregnancyIdNumber),
      ]);
      setGoat(goatData);
      setPregnancy(pregnancyData);
    } catch (error) {
      console.error("Erro ao carregar gestação", error);
      toast.error("Erro ao carregar gestação");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, goatId, pregnancyId]);

  const handleClose = async () => {
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
      return;
    }
    if (!closeForm.closeDate) {
      toast.warning("Informe a data de encerramento");
      return;
    }
    try {
      await closePregnancy(farmIdNumber, goatId!, pregnancyIdNumber, {
        ...closeForm,
        notes: closeForm.notes || undefined,
      });
      toast.success("Gestação encerrada");
      setShowCloseModal(false);
      setCloseForm({
        closeDate: "",
        status: "CLOSED",
        closeReason: "BIRTH",
        notes: "",
      });
      loadData();
    } catch (error) {
      console.error("Erro ao encerrar gestação", error);
      toast.error("Erro ao encerrar gestação");
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
      </div>
    );
  }

  if (!pregnancy) {
    return <div className="repro-empty">Gestação não encontrada.</div>;
  }

  return (
    <div className="repro-page">
      <section className="repro-hero">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <h2>Detalhes da gestação</h2>
        <p>
          Animal: <strong>{goat?.name || goatId}</strong> · Registro {goatId}
        </p>
        <div className="repro-actions">
          <button
            className="btn-outline"
            onClick={() =>
              navigate(`/app/goatfarms/${farmId}/goats/${goatId}/reproduction/events`)
            }
          >
            <i className="fa-solid fa-timeline"></i> Linha do tempo
          </button>
          {pregnancy.status === "ACTIVE" && (
            <button
              className="btn-warning"
              disabled={!canManage}
              title={!canManage ? "Sem permissao para encerrar gestacao" : ""}
              onClick={() => {
                if (!canManage) return;
                setShowCloseModal(true);
              }}
            >
              <i className="fa-solid fa-flag-checkered"></i> Encerrar gestação
            </button>
          )}
        </div>
      </section>

      <section className="repro-grid">
        <div className="repro-card">
          <h4>Status</h4>
          <p>{pregnancy.status === "ACTIVE" ? "Ativa" : "Encerrada"}</p>
        </div>
        <div className="repro-card">
          <h4>Data da cobertura</h4>
          <p>{formatDate(pregnancy.breedingDate)}</p>
        </div>
        <div className="repro-card">
          <h4>Confirmação</h4>
          <p>{formatDate(pregnancy.confirmDate)}</p>
        </div>
        <div className="repro-card">
          <h4>Parto previsto</h4>
          <p>{formatDate(pregnancy.expectedDueDate)}</p>
        </div>
        <div className="repro-card">
          <h4>Encerramento</h4>
          <p>{formatDate(pregnancy.closedAt)}</p>
        </div>
        <div className="repro-card">
          <h4>Motivo</h4>
          <p>{pregnancy.closeReason || "-"}</p>
        </div>
      </section>

      {showCloseModal && (
        <div className="repro-modal">
          <div className="repro-modal-content">
            <h3>Encerrar gestação</h3>
            <div className="repro-form-grid">
              <div>
                <label>Data do encerramento</label>
                <input
                  type="date"
                  value={closeForm.closeDate}
                  onChange={(e) =>
                    setCloseForm((prev) => ({ ...prev, closeDate: e.target.value }))
                  }
                  disabled={!canManage}
                />
              </div>
              <div>
                <label>Motivo</label>
                <select
                  value={closeForm.closeReason}
                  onChange={(e) =>
                    setCloseForm((prev) => ({
                      ...prev,
                      closeReason: e.target.value as PregnancyCloseReason,
                    }))
                  }
                  disabled={!canManage}
                >
                  {closeReasonOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Observações</label>
                <textarea
                  rows={3}
                  value={closeForm.notes}
                  onChange={(e) =>
                    setCloseForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  disabled={!canManage}
                />
              </div>
            </div>
            <div className="repro-modal-actions">
              <button className="btn-secondary" onClick={() => setShowCloseModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleClose} disabled={!canManage}>
                Encerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

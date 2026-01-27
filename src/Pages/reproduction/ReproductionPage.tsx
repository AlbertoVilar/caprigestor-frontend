import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchGoatByFarmAndRegistration } from "../../api/GoatAPI/goat";
import {
  confirmPregnancy,
  getActivePregnancy,
  getPregnancies,
  getReproductiveEvents,
  registerBreeding,
} from "../../api/GoatFarmAPI/reproduction";
import { usePermissions } from "../../Hooks/usePermissions";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type {
  BreedingRequestDTO,
  PregnancyConfirmRequestDTO,
  PregnancyResponseDTO,
  ReproductiveEventResponseDTO,
} from "../../Models/ReproductionDTOs";
import "./reproductionPages.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString();
};

const breedingOptions = [
  { value: "NATURAL", label: "Cobertura natural" },
  { value: "AI", label: "Inseminação (IA)" },
];

const checkOptions = [
  { value: "POSITIVE", label: "Positiva" },
  { value: "NEGATIVE", label: "Negativa" },
  { value: "PENDING", label: "Pendente" },
];

type TabKey = "breeding" | "active" | "history";

export default function ReproductionPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const { canManageReproduction } = useFarmPermissions(farmIdNumber);

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [activePregnancy, setActivePregnancy] = useState<PregnancyResponseDTO | null>(null);
  const [breedingEvents, setBreedingEvents] = useState<ReproductiveEventResponseDTO[]>([]);
  const [pregnancyHistory, setPregnancyHistory] = useState<PregnancyResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("breeding");

  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [breedingForm, setBreedingForm] = useState<BreedingRequestDTO>({
    eventDate: "",
    breedingType: "NATURAL",
    breederRef: "",
    notes: "",
  });

  const [confirmForm, setConfirmForm] = useState<PregnancyConfirmRequestDTO>({
    checkDate: "",
    checkResult: "POSITIVE",
    notes: "",
  });

  const canManage = permissions.isAdmin() || canManageReproduction;
  const confirmDisabled = !canManage || activePregnancy?.status === "ACTIVE";
  const confirmTitle = !canManage
    ? "Sem permissao para confirmar prenhez"
    : activePregnancy?.status === "ACTIVE"
      ? "Ja existe uma gestacao ativa para este animal"
      : "Confirmar prenhez";

  const loadData = async () => {
    if (!farmId || !goatId) return;
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        fetchGoatByFarmAndRegistration(Number(farmId), goatId),
        getActivePregnancy(farmIdNumber, goatId),
        getReproductiveEvents(farmIdNumber, goatId, 0, 10),
        getPregnancies(farmIdNumber, goatId, 0, 10),
      ]);

      const goatResult = results[0];
      const activeResult = results[1];
      const eventsResult = results[2];
      const pregnanciesResult = results[3];

      if (goatResult.status == "fulfilled") {
        setGoat(goatResult.value);
      } else {
        console.warn("Reprodução: falha ao buscar dados da cabra", goatResult.reason);
      }

      if (activeResult.status == "fulfilled") {
        setActivePregnancy(activeResult.value);
      }

      if (eventsResult.status == "fulfilled") {
        const events = eventsResult.value.content || [];
        const coverageEvents = events.filter((event) => event.eventType === "COVERAGE");
        setBreedingEvents(coverageEvents.length ? coverageEvents : events);
      } else {
        console.error("Reprodução: falha ao buscar eventos", eventsResult.reason);
      }

      if (pregnanciesResult.status == "fulfilled") {
        setPregnancyHistory(pregnanciesResult.value.content || []);
      }
    } catch (error) {
      console.error("Erro ao carregar reprodução", error);
      toast.error("Erro ao carregar reprodução");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, goatId]);

  const handleBreedingSubmit = async () => {
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
      return;
    }
    if (!breedingForm.eventDate) {
      toast.warning("Informe a data da cobertura");
      return;
    }
    try {
      await registerBreeding(farmIdNumber, goatId!, {
        ...breedingForm,
        breederRef: breedingForm.breederRef || undefined,
        notes: breedingForm.notes || undefined,
      });
      toast.success("Cobertura registrada");
      setShowBreedingModal(false);
      setBreedingForm({
        eventDate: "",
        breedingType: "NATURAL",
        breederRef: "",
        notes: "",
      });
      loadData();
    } catch (error) {
      console.error("Erro ao registrar cobertura", error);
      toast.error("Erro ao registrar cobertura");
    }
  };

  const handleConfirmSubmit = async () => {
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
      return;
    }
    if (!confirmForm.checkDate) {
      setConfirmError("Informe a data da confirmação.");
      return;
    }
    try {
      setConfirmError(null);
      const response = await confirmPregnancy(farmIdNumber, goatId!, {
        ...confirmForm,
        notes: confirmForm.notes || undefined,
      });
      toast.success("Confirmação registrada");
      setShowConfirmModal(false);
      setActivePregnancy(response);
      setTab("active");
      setConfirmForm({
        checkDate: "",
        checkResult: "POSITIVE",
        notes: "",
      });
      setPregnancyHistory((prev) => {
        const exists = prev.some((item) => item.id === response.id);
        if (exists) {
          return prev.map((item) => (item.id === response.id ? response : item));
        }
        return [response, ...prev];
      });
    } catch (error) {
      console.error("Erro ao confirmar gestação", error);
      const parsed = parseApiError(error);
      const message = getApiErrorMessage(parsed);
      setConfirmError(message);
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
    <div className="repro-page">
      <section className="repro-hero">
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <h2>Reprodução</h2>
        <p className="text-muted">Fazenda · Cabra · Reprodução</p>
        <p>
          Animal: <strong>{goat?.name || goatId}</strong> · Registro {goatId}
        </p>
        <div className="repro-actions">
          <button className="btn-outline" onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/reproduction/events`)}>
            <i className="fa-solid fa-timeline"></i> Linha do tempo
          </button>
          <button
            className="btn-primary"
            disabled={!canManage}
            title={!canManage ? "Sem permissao para registrar cobertura" : ""}
            onClick={() => {
              if (!canManage) return;
              setShowBreedingModal(true);
            }}
          >
            <i className="fa-solid fa-plus"></i> Registrar cobertura
          </button>
          <button
            className="btn-outline"
            onClick={() => {
              if (!canManage || activePregnancy?.status === "ACTIVE") return;
              setConfirmError(null);
              setShowConfirmModal(true);
            }}
            disabled={confirmDisabled}
            title={confirmTitle}
          >
            <i className="fa-solid fa-clipboard-check"></i> Confirmar prenhez
          </button>
        </div>
      </section>

      <section className="repro-tabs">
        <button
          className={`repro-tab ${tab === "breeding" ? "active" : ""}`}
          onClick={() => setTab("breeding")}
        >
          Coberturas
        </button>
        <button
          className={`repro-tab ${tab === "active" ? "active" : ""}`}
          onClick={() => setTab("active")}
        >
          Prenhez ativa
        </button>
        <button
          className={`repro-tab ${tab === "history" ? "active" : ""}`}
          onClick={() => setTab("history")}
        >
          Histórico
        </button>
      </section>

      {tab === "breeding" && (
        <section className="repro-list">
          {breedingEvents.length === 0 ? (
            <div className="repro-empty">Nenhuma cobertura registrada.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Reprodutor</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {breedingEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDate(event.eventDate)}</td>
                    <td>
                      {event.breedingType === "AI" ? "Inseminação" : "Natural"}
                    </td>
                    <td>{event.breederRef || "-"}</td>
                    <td>{event.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === "active" && (
        <section className="repro-grid">
          {!activePregnancy ? (
            <div className="repro-empty">Nenhuma gestação ativa registrada.</div>
          ) : (
            <>
              <div className="repro-card">
                <h4>Status</h4>
                <p>Gestação ativa</p>
              </div>
              <div className="repro-card">
                <h4>Data da cobertura</h4>
                <p>{formatDate(activePregnancy.breedingDate)}</p>
              </div>
              <div className="repro-card">
                <h4>Confirmação</h4>
                <p>{formatDate(activePregnancy.confirmDate)}</p>
              </div>
              <div className="repro-card">
                <h4>Parto previsto</h4>
                <p>{formatDate(activePregnancy.expectedDueDate)}</p>
              </div>
              <div className="repro-card">
                <h4>Detalhes</h4>
                <button
                  className="btn-outline"
                  onClick={() =>
                    navigate(
                      `/app/goatfarms/${farmId}/goats/${goatId}/reproduction/pregnancies/${activePregnancy.id}`
                    )
                  }
                >
                  Ver gestação
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {tab === "history" && (
        <section className="repro-list">
          {pregnancyHistory.length === 0 ? (
            <div className="repro-empty">Nenhuma gestação registrada.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Início</th>
                  <th>Parto previsto</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pregnancyHistory.map((pregnancy) => (
                  <tr key={pregnancy.id}>
                    <td>{formatDate(pregnancy.breedingDate)}</td>
                    <td>{formatDate(pregnancy.expectedDueDate)}</td>
                    <td>{pregnancy.status === "ACTIVE" ? "Ativa" : "Encerrada"}</td>
                    <td className="repro-actions-cell">
                      <button
                        className="btn-outline"
                        onClick={() =>
                          navigate(
                            `/app/goatfarms/${farmId}/goats/${goatId}/reproduction/pregnancies/${pregnancy.id}`
                          )
                        }
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {showBreedingModal && (
        <div className="repro-modal">
          <div className="repro-modal-content">
            <h3>Registrar cobertura</h3>
            <div className="repro-form-grid">
              <div>
                <label>Data da cobertura</label>
                <input
                  type="date"
                  value={breedingForm.eventDate}
                  onChange={(e) =>
                    setBreedingForm((prev) => ({ ...prev, eventDate: e.target.value }))
                  }
                  disabled={!canManage}
                />
              </div>
              <div>
                <label>Tipo</label>
                <select
                  value={breedingForm.breedingType}
                  onChange={(e) =>
                    setBreedingForm((prev) => ({
                      ...prev,
                      breedingType: e.target.value as BreedingRequestDTO["breedingType"],
                    }))
                  }
                  disabled={!canManage}
                >
                  {breedingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Reprodutor (ref.)</label>
                <input
                  type="text"
                  value={breedingForm.breederRef}
                  onChange={(e) =>
                    setBreedingForm((prev) => ({ ...prev, breederRef: e.target.value }))
                  }
                  disabled={!canManage}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Observações</label>
                <textarea
                  rows={3}
                  value={breedingForm.notes}
                  onChange={(e) =>
                    setBreedingForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  disabled={!canManage}
                />
              </div>
            </div>
            <div className="repro-modal-actions">
              <button className="btn-secondary" onClick={() => setShowBreedingModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleBreedingSubmit} disabled={!canManage}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="repro-modal">
          <div className="repro-modal-content">
            <h3>Confirmar prenhez</h3>
            <div className="repro-form-grid">
              <div>
                <label>Data da confirmação</label>
                <input
                  type="date"
                  value={confirmForm.checkDate}
                  onChange={(e) => {
                    setConfirmForm((prev) => ({ ...prev, checkDate: e.target.value }));
                    setConfirmError(null);
                  }}
                  disabled={!canManage}
                />
                {confirmError && <p className="text-danger">{confirmError}</p>}
              </div>
              <div>
                <label>Resultado</label>
                <select
                  value={confirmForm.checkResult}
                  onChange={(e) =>
                    setConfirmForm((prev) => ({
                      ...prev,
                      checkResult: e.target.value as PregnancyConfirmRequestDTO["checkResult"],
                    }))
                  }
                  disabled={!canManage}
                >
                  {checkOptions.map((option) => (
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
                  value={confirmForm.notes}
                  onChange={(e) =>
                    setConfirmForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  disabled={!canManage}
                />
              </div>
            </div>
            <div className="repro-modal-actions">
              <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleConfirmSubmit} disabled={!canManage}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

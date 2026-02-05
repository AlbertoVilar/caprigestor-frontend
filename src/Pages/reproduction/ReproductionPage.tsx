import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import {
  closePregnancy,
  confirmPregnancyPositive,
  createBreeding,
  getActivePregnancy,
  listPregnancies,
  listReproductiveEvents,
  registerNegativeCheck,
} from "../../api/GoatFarmAPI/reproduction";
import { usePermissions } from "../../Hooks/usePermissions";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type {
  BreedingRequestDTO,
  PregnancyCheckRequestDTO,
  PregnancyCloseReason,
  PregnancyCloseRequestDTO,
  PregnancyConfirmRequestDTO,
  PregnancyResponseDTO,
  ReproductiveEventResponseDTO,
} from "../../Models/ReproductionDTOs";
import {
  addDaysLocalDate,
  diffDaysLocalDate,
  formatLocalDatePtBR,
  getTodayLocalDate,
} from "../../utils/localDate";
import "./reproductionPages.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString();
};

const getCloseDate = (pregnancy: PregnancyResponseDTO) =>
  pregnancy.closeDate || pregnancy.closedAt || null;

const breedingOptions = [
  { value: "NATURAL", label: "Cobertura natural" },
  { value: "AI", label: "Inseminação (IA)" },
];

const checkOptions = [
  { value: "POSITIVE", label: "Positiva" },
  { value: "NEGATIVE", label: "Negativa" },
];

const eventLabels: Record<string, string> = {
  COVERAGE: "Cobertura",
  PREGNANCY_CHECK: "Diagnóstico de prenhez",
  PREGNANCY_CLOSE: "Encerramento de gestação",
};

const checkResultLabels: Record<string, string> = {
  POSITIVE: "Positiva",
  NEGATIVE: "Negativa",
  PENDING: "Pendente",
};

const closeReasonLabels: Record<PregnancyCloseReason, string> = {
  BIRTH: "Parto",
  ABORTION: "Aborto",
  LOSS: "Perda",
  FALSE_POSITIVE: "Falso positivo",
  OTHER: "Outro",
  DATA_FIX_DUPLICATED_ACTIVE: "Correção de dados",
};

type DiagnosisForm = {
  checkDate: string;
  checkResult: "POSITIVE" | "NEGATIVE";
  notes: string;
};

export default function ReproductionPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const { canManageReproduction } = useFarmPermissions(farmIdNumber);

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [activePregnancy, setActivePregnancy] = useState<PregnancyResponseDTO | null>(null);
  const [latestEvents, setLatestEvents] = useState<ReproductiveEventResponseDTO[]>([]);
  const [pregnancyHistory, setPregnancyHistory] = useState<PregnancyResponseDTO[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [breedingError, setBreedingError] = useState<string | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

  const [breedingForm, setBreedingForm] = useState<BreedingRequestDTO>({
    eventDate: "",
    breedingType: "NATURAL",
    breederRef: "",
    notes: "",
  });

  const [diagnosisForm, setDiagnosisForm] = useState<DiagnosisForm>({
    checkDate: "",
    checkResult: "POSITIVE",
    notes: "",
  });

  const [closeForm, setCloseForm] = useState<PregnancyCloseRequestDTO>({
    closeDate: "",
    status: "CLOSED",
    closeReason: "BIRTH",
    notes: "",
  });

  const canManage = permissions.isAdmin() || canManageReproduction;

  const latestCoverageDate = useMemo(() => {
    if (activePregnancy?.breedingDate) return activePregnancy.breedingDate;
    const coverageEvent = latestEvents.find((event) => event.eventType === "COVERAGE");
    return coverageEvent?.eventDate;
  }, [activePregnancy, latestEvents]);

  const minCheckDate = latestCoverageDate ? addDaysLocalDate(latestCoverageDate, 60) : null;
  const todayLocalDate = getTodayLocalDate();
  const daysUntilEligible = minCheckDate ? diffDaysLocalDate(todayLocalDate, minCheckDate) : null;
  const isBeforeMinDate =
    !!minCheckDate &&
    !!diagnosisForm.checkDate &&
    diffDaysLocalDate(diagnosisForm.checkDate, minCheckDate) > 0;

  const handleFormError = (
    error: unknown,
    setError: (message: string | null) => void
  ) => {
    const parsed = parseApiError(error);
    const message =
      parsed.status === 403
        ? "Sem permissão para acessar esta fazenda."
        : parsed.message || getApiErrorMessage(parsed);
    setError(message);
    if (parsed.status !== 403) {
      toast.error(message);
    }
  };

  const loadData = async (pageOverride = historyPage) => {
    if (!farmId || !goatId) return;
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        fetchGoatById(Number(farmId), goatId),
        getActivePregnancy(farmIdNumber, goatId),
        listReproductiveEvents(farmIdNumber, goatId, { page: 0, size: 5 }),
        listPregnancies(farmIdNumber, goatId, { page: pageOverride, size: 10 }),
      ]);

      const goatResult = results[0];
      const activeResult = results[1];
      const eventsResult = results[2];
      const pregnanciesResult = results[3];

      const rejected = results.find((result) => result.status === "rejected");
      if (rejected) {
        const parsed = parseApiError(rejected.reason);
        if (parsed.status === 403) {
          toast.error("Sem permissÃ£o para acessar esta fazenda.");
        }
      }

      if (goatResult.status === "fulfilled") {
        setGoat(goatResult.value);
      }

      if (activeResult.status === "fulfilled") {
        setActivePregnancy(activeResult.value);
      }

      if (eventsResult.status === "fulfilled") {
        setLatestEvents(eventsResult.value.content || []);
      }

      if (pregnanciesResult.status === "fulfilled") {
        setPregnancyHistory(pregnanciesResult.value.content || []);
        setHistoryTotalPages(pregnanciesResult.value.totalPages || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar reprodução", error);
      toast.error("Erro ao carregar reprodução");
    } finally {
      setLoading(false);
    }
  };

  const refreshLists = async (pageOverride = historyPage) => {
    if (!farmId || !goatId) return;
    const results = await Promise.allSettled([
      listReproductiveEvents(farmIdNumber, goatId, { page: 0, size: 5 }),
      listPregnancies(farmIdNumber, goatId, { page: pageOverride, size: 10 }),
    ]);

    const eventsResult = results[0];
    const pregnanciesResult = results[1];

    if (eventsResult.status === "fulfilled") {
      setLatestEvents(eventsResult.value.content || []);
    }

    if (pregnanciesResult.status === "fulfilled") {
      setPregnancyHistory(pregnanciesResult.value.content || []);
      setHistoryTotalPages(pregnanciesResult.value.totalPages || 0);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, goatId, historyPage]);

  const handleBreedingSubmit = async () => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (!breedingForm.eventDate) {
      setBreedingError("Informe a data da cobertura.");
      return;
    }
    try {
      setBreedingError(null);
      await createBreeding(farmIdNumber, goatId!, {
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
      await refreshLists();
    } catch (error) {
      console.error("Erro ao registrar cobertura", error);
      handleFormError(error, setBreedingError);
    }
  };

  const handleDiagnosisSubmit = async () => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (!diagnosisForm.checkDate) {
      setDiagnosisError("Informe a data do diagnóstico.");
      return;
    }
    if (isBeforeMinDate) {
      setDiagnosisError("Aguardando janela mínima de 60 dias após a última cobertura.");
      return;
    }
    try {
      setDiagnosisError(null);
      const previousActiveId = activePregnancy?.id;

      if (diagnosisForm.checkResult === "POSITIVE") {
        const payload: PregnancyConfirmRequestDTO = {
          checkDate: diagnosisForm.checkDate,
          checkResult: "POSITIVE",
          notes: diagnosisForm.notes || undefined,
        };
        const response = await confirmPregnancyPositive(farmIdNumber, goatId!, payload);
        const updatedActive = await getActivePregnancy(farmIdNumber, goatId!);
        setActivePregnancy(updatedActive || response);
        toast.success("Diagnóstico positivo registrado");
      } else {
        const payload: PregnancyCheckRequestDTO = {
          checkDate: diagnosisForm.checkDate,
          checkResult: "NEGATIVE",
          notes: diagnosisForm.notes || undefined,
        };
        await registerNegativeCheck(farmIdNumber, goatId!, payload);
        const updatedActive = await getActivePregnancy(farmIdNumber, goatId!);
        setActivePregnancy(updatedActive);
        if (previousActiveId && !updatedActive) {
          toast.info("Gestação encerrada como falso positivo.");
        } else {
          toast.success("Diagnóstico negativo registrado");
        }
      }

      setShowDiagnosisModal(false);
      setDiagnosisForm({
        checkDate: "",
        checkResult: "POSITIVE",
        notes: "",
      });
      await refreshLists();
    } catch (error) {
      console.error("Erro ao registrar diagnóstico", error);
      handleFormError(error, setDiagnosisError);
    }
  };

  const handleCloseSubmit = async () => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (!activePregnancy) {
      toast.error("Sem gestação ativa para encerrar.");
      return;
    }
    if (!closeForm.closeDate) {
      setCloseError("Informe a data de encerramento.");
      return;
    }
    try {
      setCloseError(null);
      await closePregnancy(farmIdNumber, goatId!, activePregnancy.id, {
        ...closeForm,
        status: "CLOSED",
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
      const updatedActive = await getActivePregnancy(farmIdNumber, goatId!);
      setActivePregnancy(updatedActive);
      await refreshLists();
    } catch (error) {
      console.error("Erro ao encerrar gestação", error);
      handleFormError(error, setCloseError);
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
        <p className="text-muted" style={{ marginTop: "0.75rem" }}>
          Ações rápidas
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
          <button
            className="btn-primary"
            disabled={!canManage}
            title={!canManage ? "Sem permissão para registrar cobertura" : ""}
            onClick={() => {
              if (!canManage) return;
              setShowBreedingModal(true);
            }}
          >
            <i className="fa-solid fa-plus"></i> Registrar cobertura
          </button>
          <button
            className="btn-outline"
            disabled={!canManage}
            title={!canManage ? "Sem permissão para registrar diagnóstico" : ""}
            onClick={() => {
              if (!canManage) return;
              setDiagnosisError(null);
              setShowDiagnosisModal(true);
            }}
          >
            <i className="fa-solid fa-clipboard-check"></i> Registrar diagnóstico
          </button>
          <button
            className="btn-warning"
            disabled={!canManage || !activePregnancy}
            title={
              !activePregnancy
                ? "Sem gestação ativa"
                : !canManage
                  ? "Sem permissão para encerrar gestação"
                  : ""
            }
            onClick={() => {
              if (!canManage || !activePregnancy) return;
              setCloseError(null);
              setShowCloseModal(true);
            }}
          >
            <i className="fa-solid fa-flag-checkered"></i> Encerrar gestação
          </button>
        </div>
        {minCheckDate && (
          <p className="repro-confirm-hint text-muted small">
            Janela mínima de 60 dias após a última cobertura. Disponível a partir de{" "}
            {formatLocalDatePtBR(minCheckDate)}.
            {typeof daysUntilEligible === "number" && daysUntilEligible > 0 && (
              <>
                {" "}
                Faltam {daysUntilEligible} dia{daysUntilEligible > 1 ? "s" : ""} para o
                diagnóstico.
              </>
            )}
          </p>
        )}
      </section>

      <section className="repro-grid">
        {!activePregnancy ? (
          <div className="repro-card">
            <h4>Gestação ativa</h4>
            <p>Sem gestação ativa</p>
          </div>
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

      <section className="repro-list">
        <div className="repro-event-header" style={{ marginBottom: "1rem" }}>
          <div className="repro-event-title">Últimos eventos</div>
          <button
            className="btn-outline"
            onClick={() =>
              navigate(`/app/goatfarms/${farmId}/goats/${goatId}/reproduction/events`)
            }
          >
            Ver todos
          </button>
        </div>
        {latestEvents.length === 0 ? (
          <div className="repro-empty">Nenhum evento reprodutivo registrado.</div>
        ) : (
          <div className="repro-timeline">
            {latestEvents.map((event) => (
              <article key={event.id} className="repro-event">
                <div className="repro-event-header">
                  <div className="repro-event-title">
                    {eventLabels[event.eventType] || event.eventType}
                  </div>
                  <div className="repro-event-meta">{formatDate(event.eventDate)}</div>
                </div>
                <div className="repro-event-meta">
                  {event.breedingType && (
                    <span>
                      Tipo: {event.breedingType === "AI" ? "IA" : "Natural"} ·{" "}
                    </span>
                  )}
                  {event.breederRef && <span>Ref.: {event.breederRef} · </span>}
                  {event.checkResult && (
                    <span>
                      Resultado: {checkResultLabels[event.checkResult] || event.checkResult}
                    </span>
                  )}
                </div>
                {event.notes && <p>{event.notes}</p>}
                {event.pregnancyId && (
                  <div className="repro-actions">
                    <button
                      className="btn-outline"
                      onClick={() =>
                        navigate(
                          `/app/goatfarms/${farmId}/goats/${goatId}/reproduction/pregnancies/${event.pregnancyId}`
                        )
                      }
                    >
                      Ver gestação
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="repro-list">
        <h3 style={{ marginTop: 0 }}>Histórico de gestações</h3>
        {pregnancyHistory.length === 0 ? (
          <div className="repro-empty">Nenhuma gestação registrada.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Cobertura</th>
                <th>Confirmação</th>
                <th>Encerramento</th>
                <th>Motivo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pregnancyHistory.map((pregnancy) => {
                const isFalsePositive = pregnancy.closeReason === "FALSE_POSITIVE";
                const statusLabel =
                  pregnancy.status === "ACTIVE"
                    ? "Ativa"
                    : isFalsePositive
                      ? "Encerrada (falso positivo)"
                      : "Encerrada";

                return (
                  <tr key={pregnancy.id}>
                    <td>{statusLabel}</td>
                    <td>{formatDate(pregnancy.breedingDate)}</td>
                    <td>{formatDate(pregnancy.confirmDate)}</td>
                    <td>{formatDate(getCloseDate(pregnancy))}</td>
                    <td>
                      {pregnancy.closeReason
                        ? closeReasonLabels[pregnancy.closeReason] || pregnancy.closeReason
                        : "-"}
                    </td>
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
                );
              })}
            </tbody>
          </table>
        )}
        <div className="repro-pagination">
          <button
            className="btn-outline"
            disabled={historyPage <= 0}
            onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 0))}
          >
            Anterior
          </button>
          <span>
            Página {historyPage + 1} de {Math.max(historyTotalPages, 1)}
          </span>
          <button
            className="btn-outline"
            disabled={historyPage + 1 >= historyTotalPages}
            onClick={() => setHistoryPage((prev) => prev + 1)}
          >
            Próxima
          </button>
        </div>
      </section>

      {showBreedingModal && (
        <div className="repro-modal">
          <div className="repro-modal-content">
            <h3>Registrar cobertura</h3>
            {breedingError && <p className="text-danger">{breedingError}</p>}
            <div className="repro-form-grid">
              <div>
                <label>Data da cobertura</label>
                <input
                  type="date"
                  value={breedingForm.eventDate}
                  onChange={(e) => {
                    setBreedingForm((prev) => ({
                      ...prev,
                      eventDate: e.target.value,
                    }));
                    setBreedingError(null);
                  }}
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

      {showDiagnosisModal && (
        <div className="repro-modal">
          <div className="repro-modal-content">
            <h3>Diagnóstico de prenhez</h3>
            <div className="repro-form-grid">
              <div>
                <label>Data do diagnóstico</label>
                <input
                  type="date"
                  value={diagnosisForm.checkDate}
                  onChange={(e) => {
                    setDiagnosisForm((prev) => ({ ...prev, checkDate: e.target.value }));
                    setDiagnosisError(null);
                  }}
                  disabled={!canManage}
                  min={minCheckDate || undefined}
                  max={todayLocalDate}
                />
                {diagnosisError && <p className="text-danger">{diagnosisError}</p>}
              </div>
              <div>
                <label>Resultado</label>
                <select
                  value={diagnosisForm.checkResult}
                  onChange={(e) =>
                    setDiagnosisForm((prev) => ({
                      ...prev,
                      checkResult: e.target.value as DiagnosisForm["checkResult"],
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
                  value={diagnosisForm.notes}
                  onChange={(e) =>
                    setDiagnosisForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  disabled={!canManage}
                />
              </div>
            </div>
            <div className="repro-modal-actions">
              <button className="btn-secondary" onClick={() => setShowDiagnosisModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleDiagnosisSubmit} disabled={!canManage}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

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
                  onChange={(e) => {
                    setCloseForm((prev) => ({ ...prev, closeDate: e.target.value }));
                    setCloseError(null);
                  }}
                  disabled={!canManage}
                />
                {closeError && <p className="text-danger">{closeError}</p>}
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
                  {Object.entries(closeReasonLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
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
              <button className="btn-primary" onClick={handleCloseSubmit} disabled={!canManage}>
                Encerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

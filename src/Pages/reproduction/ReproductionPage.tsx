import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import {
  closePregnancy,
  confirmPregnancyPositive,
  createBreeding,
  getActivePregnancy,
  getDiagnosisRecommendation,
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
  DiagnosisRecommendationResponseDTO,
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
import { Button } from "../../Components/ui/Button";
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

const activePregnancyBlockMessage =
  "Existe uma gestação ativa. Para registrar nova cobertura, encerre ou corrija a gestação atual (falso positivo/aborto).";

const recommendationWarningLabels: Record<string, string> = {
  GESTACAO_ATIVA_SEM_CHECK_VALIDO:
    "Existe gestação ativa sem diagnóstico positivo válido no período recomendado.",
};

type DiagnosisForm = {
  checkDate: string;
  checkResult: "POSITIVE" | "NEGATIVE";
  notes: string;
};

type BreedingModalMode = "standard" | "late";

export default function ReproductionPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const { canManageReproduction } = useFarmPermissions(farmIdNumber);

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [activePregnancy, setActivePregnancy] = useState<PregnancyResponseDTO | null>(null);
  const [recommendation, setRecommendation] = useState<DiagnosisRecommendationResponseDTO | null>(
    null
  );
  const [latestEvents, setLatestEvents] = useState<ReproductiveEventResponseDTO[]>([]);
  const [pregnancyHistory, setPregnancyHistory] = useState<PregnancyResponseDTO[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const [breedingModalMode, setBreedingModalMode] = useState<BreedingModalMode>("standard");
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
  const hasActivePregnancy = Boolean(activePregnancy);
  const isLateBreedingModal = breedingModalMode === "late";

  const latestCoverageEventDate = useMemo(() => {
    const coverageEvent = latestEvents.find((event) => event.eventType === "COVERAGE");
    return coverageEvent?.eventDate || null;
  }, [latestEvents]);

  const activePregnancyReferenceDate = useMemo(
    () =>
      recommendation?.lastCoverage?.effectiveDate ||
      recommendation?.lastCoverage?.eventDate ||
      activePregnancy?.breedingDate ||
      null,
    [activePregnancy, recommendation]
  );

  const recommendationCoverageDate = useMemo(
    () => activePregnancyReferenceDate || latestCoverageEventDate,
    [activePregnancyReferenceDate, latestCoverageEventDate]
  );

  const minCheckDate = recommendation?.eligibleDate
    ? recommendation.eligibleDate
    : recommendationCoverageDate
      ? addDaysLocalDate(recommendationCoverageDate, 60)
      : null;
  const todayLocalDate = getTodayLocalDate();
  const daysUntilEligible = minCheckDate ? diffDaysLocalDate(todayLocalDate, minCheckDate) : null;
  const isBeforeMinDate =
    !!minCheckDate &&
    !!diagnosisForm.checkDate &&
    diffDaysLocalDate(diagnosisForm.checkDate, minCheckDate) > 0;

  // Timeline Logic
  const timelineTotalDays = 60;
  const timelineElapsedDays = recommendationCoverageDate
    ? diffDaysLocalDate(recommendationCoverageDate, todayLocalDate)
    : 0;
  const timelineProgressPercent = Math.min(
    100,
    Math.max(0, (timelineElapsedDays / timelineTotalDays) * 100)
  );
  const timelineIsOverdue = timelineElapsedDays >= timelineTotalDays;

  const recommendationWarnings = useMemo(() => {
    const warnings = recommendation?.warnings || [];
    return warnings.map((warning) => recommendationWarningLabels[warning] || warning);
  }, [recommendation]);

  const goatDisplayName = goat?.name || goatId || "Cabra";
  const goatDisplayRegistration = goat?.registrationNumber || goatId || "-";

  const reproductionStatus = useMemo(() => {
    if (activePregnancy) {
      return {
        tone: "active",
        eyebrow: "Situação reprodutiva",
        title: "Gestação ativa",
        description: activePregnancy.confirmDate
          ? `Diagnóstico positivo confirmado em ${formatLocalDatePtBR(activePregnancy.confirmDate)}.`
          : "Há uma gestação ativa em acompanhamento para este animal.",
        facts: [
          {
            label: "Cobertura",
            value: activePregnancy.breedingDate
              ? formatLocalDatePtBR(activePregnancy.breedingDate)
              : "-",
          },
          {
            label: "Parto previsto",
            value: activePregnancy.expectedDueDate
              ? formatLocalDatePtBR(activePregnancy.expectedDueDate)
              : "-",
          },
        ],
      };
    }

    if (recommendation?.status === "ELIGIBLE_PENDING") {
      return {
        tone: "pending",
        eyebrow: "Situação reprodutiva",
        title: "Diagnóstico pendente",
        description:
          "A janela mínima para diagnóstico foi atingida. Registre o resultado para atualizar a situação da cabra.",
        facts: [
          {
            label: "Cobertura",
            value: recommendationCoverageDate
              ? formatLocalDatePtBR(recommendationCoverageDate)
              : "-",
          },
          {
            label: "Prazo mínimo",
            value: recommendation.eligibleDate
              ? formatLocalDatePtBR(recommendation.eligibleDate)
              : "-",
          },
        ],
      };
    }

    if (recommendationCoverageDate) {
      return {
        tone: "neutral",
        eyebrow: "Situação reprodutiva",
        title: "Aguardando janela de diagnóstico",
        description:
          "Ainda não é o momento ideal para registrar o diagnóstico. O acompanhamento segue a partir da última cobertura.",
        facts: [
          {
            label: "Cobertura",
            value: formatLocalDatePtBR(recommendationCoverageDate),
          },
          {
            label: "Próximo marco",
            value: minCheckDate ? formatLocalDatePtBR(minCheckDate) : "-",
          },
        ],
      };
    }

    return {
      tone: "neutral",
      eyebrow: "Situação reprodutiva",
      title: "Sem gestação ativa",
      description:
        "Registre uma nova cobertura para iniciar o acompanhamento reprodutivo desta cabra.",
      facts: [
        {
          label: "Última cobertura",
          value: latestCoverageEventDate ? formatLocalDatePtBR(latestCoverageEventDate) : "Não registrada",
        },
        {
          label: "Próximo passo",
          value: "Registrar cobertura",
        },
      ],
    };
  }, [
    activePregnancy,
    latestCoverageEventDate,
    minCheckDate,
    recommendation,
    recommendationCoverageDate,
  ]);

  const handleFormError = (
    error: unknown,
    setError: (message: string | null) => void
  ) => {
    const parsed = parseApiError(error);
      const message =
        parsed.status === 403
          ? "Sem permissão para acessar esta fazenda."
          : parsed.status === 422 || parsed.status === 409
            ? parsed.message || getApiErrorMessage(parsed)
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
        getDiagnosisRecommendation(farmIdNumber, goatId),
        listReproductiveEvents(farmIdNumber, goatId, { page: 0, size: 5 }),
        listPregnancies(farmIdNumber, goatId, { page: pageOverride, size: 10 }),
      ]);

      const goatResult = results[0];
      const activeResult = results[1];
      const recommendationResult = results[2];
      const eventsResult = results[3];
      const pregnanciesResult = results[4];

      const rejected = results.find((result) => result.status === "rejected");
      if (rejected) {
        const parsed = parseApiError(rejected.reason);
        if (parsed.status === 403) {
          toast.error("Sem permissão para acessar esta fazenda.");
        }
      }

      if (goatResult.status === "fulfilled") {
        setGoat(goatResult.value);
      }

      if (activeResult.status === "fulfilled") {
        setActivePregnancy(activeResult.value);
      }

      if (recommendationResult.status === "fulfilled") {
        setRecommendation(recommendationResult.value);
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

  const refreshReproductionState = async (pageOverride = historyPage) => {
    if (!farmId || !goatId) return;
    const results = await Promise.allSettled([
      getActivePregnancy(farmIdNumber, goatId),
      getDiagnosisRecommendation(farmIdNumber, goatId),
      listReproductiveEvents(farmIdNumber, goatId, { page: 0, size: 5 }),
      listPregnancies(farmIdNumber, goatId, { page: pageOverride, size: 10 }),
    ]);

    const activeResult = results[0];
    const recommendationResult = results[1];
    const eventsResult = results[2];
    const pregnanciesResult = results[3];

    if (activeResult.status === "fulfilled") {
      setActivePregnancy(activeResult.value);
    }

    if (recommendationResult.status === "fulfilled") {
      setRecommendation(recommendationResult.value);
    }

    if (eventsResult.status === "fulfilled") {
      setLatestEvents(eventsResult.value.content || []);
    }

    if (pregnanciesResult.status === "fulfilled") {
      setPregnancyHistory(pregnanciesResult.value.content || []);
      setHistoryTotalPages(pregnanciesResult.value.totalPages || 0);
    }

    const rejected = results.find((result) => result.status === "rejected");
    if (rejected) {
      const parsed = parseApiError(rejected.reason);
      if (parsed.status === 403) {
        toast.error("Sem permissão para acessar esta fazenda.");
      }
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, goatId, historyPage]);

  const openBreedingModal = (mode: BreedingModalMode) => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (mode === "standard" && hasActivePregnancy) {
      toast.info(activePregnancyBlockMessage);
    }
    setBreedingError(null);
    setBreedingModalMode(mode);
    setShowBreedingModal(true);
  };

  const resetBreedingForm = () => {
    setBreedingForm({
      eventDate: "",
      breedingType: "NATURAL",
      breederRef: "",
      notes: "",
    });
  };

  const closeBreedingModal = () => {
    setShowBreedingModal(false);
    setBreedingModalMode("standard");
    setBreedingError(null);
  };

  const handleBreedingSubmit = async () => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (!breedingForm.eventDate) {
      setBreedingError("Informe a data da cobertura.");
      return;
    }

    const submittedDate = breedingForm.eventDate;
    const referenceDateAtSubmit = activePregnancyReferenceDate;
    const hadActivePregnancyAtSubmit = hasActivePregnancy;

    try {
      setBreedingError(null);
      await createBreeding(farmIdNumber, goatId!, {
        ...breedingForm,
        breederRef: breedingForm.breederRef || undefined,
        notes: breedingForm.notes || undefined,
      });

      const isLateRegistration =
        hadActivePregnancyAtSubmit &&
        !!referenceDateAtSubmit &&
        submittedDate < referenceDateAtSubmit;

        if (isLateRegistration) {
          toast.info(
            "Cobertura registrada como histórico (registro tardio). Não altera a gestação ativa."
          );
        } else {
        toast.success("Cobertura registrada");
      }

      closeBreedingModal();
      resetBreedingForm();
      await refreshReproductionState();
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
      await refreshReproductionState();
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
      await refreshReproductionState();
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
        <div className="repro-hero-header">
          <div className="repro-hero-copy">
            <Button
              variant="ghost"
              size="sm"
              className="repro-back-button"
              onClick={() => navigate(-1)}
            >
              <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
              Voltar
            </Button>
            <span className="repro-section-eyebrow">Reprodução</span>
            <h1 className="repro-hero-title">Reprodução</h1>
            <p className="repro-hero-context">Fazenda · Cabra · Reprodução</p>
            <p className="repro-hero-animal">
              Animal: <strong>{goatDisplayName}</strong> · Registro {goatDisplayRegistration}
            </p>
          </div>

          <aside className={`repro-status-card repro-status-card--${reproductionStatus.tone}`}>
            <span className="repro-status-eyebrow">{reproductionStatus.eyebrow}</span>
            <h3>{reproductionStatus.title}</h3>
            <p>{reproductionStatus.description}</p>
            <div className="repro-status-grid">
              {reproductionStatus.facts.map((fact) => (
                <div key={fact.label} className="repro-status-item">
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="repro-quick-actions">
          <div className="repro-quick-actions-header">
            <div>
              <span className="repro-section-eyebrow repro-section-eyebrow--muted">
                Fluxo operacional
              </span>
              <h2 className="repro-quick-actions-title">Ações do ciclo reprodutivo</h2>
              <p className="repro-action-helper">
                Registre eventos e atualize o estado reprodutivo sem sair desta página.
              </p>
            </div>
          </div>

          <div className="repro-action-shell">
            <div className="repro-actions">
              <Button
                variant={hasActivePregnancy ? "secondary" : "primary"}
                className="repro-action-button repro-action-button--coverage"
                disabled={!canManage || hasActivePregnancy}
                title={
                  !canManage
                    ? "Sem permissão para registrar cobertura."
                    : hasActivePregnancy
                      ? activePregnancyBlockMessage
                      : ""
                }
                onClick={() => openBreedingModal("standard")}
              >
                <i className="fa-solid fa-plus" aria-hidden="true"></i>
                Registrar cobertura
              </Button>

              <Button
                variant={recommendation?.status === "ELIGIBLE_PENDING" ? "primary" : "outline"}
                className="repro-action-button repro-action-button--diagnosis"
                disabled={!canManage}
                title={!canManage ? "Sem permissão para registrar diagnóstico." : ""}
                onClick={() => {
                  if (!canManage) return;
                  setDiagnosisError(null);
                  setShowDiagnosisModal(true);
                }}
              >
                <i className="fa-solid fa-clipboard-check" aria-hidden="true"></i>
                Registrar diagnóstico
              </Button>

              <Button
                variant="outline"
                className="repro-action-button repro-action-button--support"
                onClick={() =>
                  navigate(`/app/goatfarms/${farmId}/goats/${goatId}/reproduction/events`)
                }
              >
                <i className="fa-solid fa-timeline" aria-hidden="true"></i>
                Linha do tempo
              </Button>

              {hasActivePregnancy && (
                <Button
                  variant="outline"
                  className="repro-action-button repro-action-button--support"
                  disabled={!canManage}
                  title={!canManage ? "Sem permissão para registrar cobertura antiga." : ""}
                  onClick={() => openBreedingModal("late")}
                >
                  <i className="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
                  Registrar cobertura antiga
                </Button>
              )}
            </div>

            <div className="repro-critical-action">
              <span className="repro-critical-action-label">Encerramento</span>
              <p className="repro-critical-action-copy">
                Use somente quando a gestação precisar ser finalizada por parto, aborto, perda ou
                correção de dados.
              </p>
              <Button
                variant="warning"
                className="repro-critical-button"
                disabled={!canManage || !hasActivePregnancy}
                title={
                  !hasActivePregnancy
                    ? "Sem gestação ativa."
                    : !canManage
                      ? "Sem permissão para encerrar gestação."
                      : ""
                }
                onClick={() => {
                  if (!canManage || !hasActivePregnancy) return;
                  setCloseError(null);
                  setShowCloseModal(true);
                }}
              >
                <i className="fa-solid fa-flag-checkered" aria-hidden="true"></i>
                Encerrar gestação
              </Button>
            </div>
          </div>
        </div>

        {hasActivePregnancy && (
          <p className="repro-action-helper repro-action-helper--warning">
            Gestação ativa em acompanhamento. Novas coberturas ficam bloqueadas até o encerramento
            ou correção desta gestação.
          </p>
        )}

        {recommendation?.status === "RESOLVED" ? (
          (() => {
            const check = recommendation.lastCheck;
            const latestHistory = pregnancyHistory.length > 0 ? pregnancyHistory[0] : null;

            let alertType = "success"; // success | neutral
            let alertIcon = "fa-circle-check";
            let alertText = "Diagnóstico resolvido";

            if (check?.checkResult === "NEGATIVE") {
              alertType = "neutral";
              alertIcon = "fa-circle-xmark";
              alertText = "Diagnóstico negativo (vazia)";
            } else if (check?.checkResult === "POSITIVE") {
              alertText = "Diagnóstico positivo registrado";

              if (!hasActivePregnancy && latestHistory?.status === "CLOSED") {
                const reason = latestHistory.closeReason;
                if (reason === "FALSE_POSITIVE") {
                  alertType = "neutral";
                  alertIcon = "fa-circle-exclamation";
                  alertText = "Diagnóstico anulado (falso positivo)";
                } else if (reason === "ABORTION" || reason === "LOSS") {
                  alertType = "neutral";
                  alertIcon = "fa-heart-crack";
                  alertText = `Gestação encerrada (${reason === "ABORTION" ? "Aborto" : "Perda"})`;
                }
              }
            }

            return (
              <div
                className={
                  alertType === "neutral"
                    ? "repro-diagnosis-alert-neutral"
                    : "repro-diagnosis-alert-success"
                }
              >
                <p className="repro-resolved-alert-copy">
                  <i className={`fa-solid ${alertIcon}`} style={{ marginRight: "0.5rem" }}></i>
                  {alertText}
                  {check?.checkDate
                    ? ` em ${formatLocalDatePtBR(check.checkDate)}`
                    : ""}
                  .
                </p>
              </div>
            );
          })()
        ) : recommendation?.status === "ELIGIBLE_PENDING" ? (
          <div className="repro-diagnosis-alert-warning">
            <div className="repro-diagnosis-alert-header">
              <div className="repro-diagnosis-alert-content">
                <span className="repro-diagnosis-alert-title">
                  <i className="fa-solid fa-triangle-exclamation"></i> Diagnóstico pendente
                </span>
                <span className="repro-diagnosis-alert-text">
                  Prazo mínimo atingido em{" "}
                  {recommendation.eligibleDate
                    ? formatLocalDatePtBR(recommendation.eligibleDate)
                    : "-"}
                  . Registre o diagnóstico.
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="repro-inline-button repro-inline-button--compact"
                onClick={() => {
                  if (!canManage) return;
                  setDiagnosisError(null);
                  setShowDiagnosisModal(true);
                }}
                disabled={!canManage}
              >
                Registrar diagnóstico
              </Button>
            </div>
            <div className="repro-timeline-container">
              <div className="repro-timeline-bar-bg">
                <div
                  className="repro-timeline-bar-fill overdue"
                  style={{ width: "100%" }}
                >
                  <div className="repro-timeline-indicator"></div>
                </div>
              </div>
              <div className="repro-timeline-labels">
                <span className="repro-timeline-label-start">
                  <span>Cobertura</span>
                  <span className="repro-timeline-date">
                    {recommendationCoverageDate
                      ? formatLocalDatePtBR(recommendationCoverageDate)
                      : "-"}
                  </span>
                </span>
                <span className="repro-timeline-label-end">
                  <span>Diagnóstico</span>
                  <span className="repro-timeline-date" style={{ color: "#ef4444", fontWeight: 700 }}>
                    Atrasado ({timelineElapsedDays} dias)
                  </span>
                </span>
              </div>
            </div>
          </div>
        ) : recommendationCoverageDate ? (
          <div className="repro-timeline-container">
            <div className="repro-timeline-bar-bg">
              <div
                className={`repro-timeline-bar-fill ${timelineIsOverdue ? "overdue" : ""}`}
                style={{ width: `${timelineProgressPercent}%` }}
              >
                <div className="repro-timeline-indicator"></div>
              </div>
            </div>
            <div className="repro-timeline-labels">
              <span className="repro-timeline-label-start">
                <span>Cobertura</span>
                <span className="repro-timeline-date">
                  {formatLocalDatePtBR(recommendationCoverageDate)}
                </span>
              </span>
              <span className="repro-timeline-label-end">
                <span>Diagnóstico</span>
                <span className="repro-timeline-date">
                  {minCheckDate ? formatLocalDatePtBR(minCheckDate) : "-"}
                </span>
              </span>
            </div>
            <p className="repro-confirm-hint text-muted small" style={{ marginTop: "0.5rem" }}>
              {typeof daysUntilEligible === "number" && daysUntilEligible > 0
                ? `Faltam ${daysUntilEligible} dia${daysUntilEligible > 1 ? "s" : ""} para o diagnóstico.`
                : "Aguardando janela mínima de 60 dias."}
            </p>
          </div>
        ) : (
          <p className="repro-confirm-hint text-muted small">
            Sem cobertura registrada para recomendação de diagnóstico.
          </p>
        )}

        {recommendationWarnings.length > 0 && (
          <div className="repro-warning-list">
            {recommendationWarnings.map((warning) => (
              <p key={warning} className="repro-warning-inline text-muted small">
                {warning}
              </p>
            ))}
          </div>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/app/goatfarms/${farmId}/goats/${goatId}/reproduction/pregnancies/${activePregnancy.id}`
                  )
                }
              >
                Ver gestação
              </Button>
            </div>
          </>
        )}
      </section>

      <section className="repro-list">
        <div className="repro-event-header" style={{ marginBottom: "1rem" }}>
          <div className="repro-event-title">Últimos eventos</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`/app/goatfarms/${farmId}/goats/${goatId}/reproduction/events`)
            }
          >
            Ver todos
          </Button>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/app/goatfarms/${farmId}/goats/${goatId}/reproduction/pregnancies/${event.pregnancyId}`
                        )
                      }
                    >
                      Ver gestação
                    </Button>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/app/goatfarms/${farmId}/goats/${goatId}/reproduction/pregnancies/${pregnancy.id}`
                          )
                        }
                      >
                        Ver detalhes
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="repro-pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={historyPage <= 0}
            onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 0))}
          >
            Anterior
          </Button>
          <span>
            Página {historyPage + 1} de {Math.max(historyTotalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={historyPage + 1 >= historyTotalPages}
            onClick={() => setHistoryPage((prev) => prev + 1)}
          >
            Próxima
          </Button>
        </div>
      </section>

      {showBreedingModal && (
        <div className="repro-modal">
          <div className="repro-modal-content">
            <h3>{isLateBreedingModal ? "Registrar cobertura antiga" : "Registrar cobertura"}</h3>
            {isLateBreedingModal && (
              <p className="text-muted small">
                Registre uma cobertura com data anterior para manter o histórico reprodutivo.
              </p>
            )}
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
              <Button variant="secondary" onClick={closeBreedingModal}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleBreedingSubmit} disabled={!canManage}>
                Salvar
              </Button>
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
              <Button variant="secondary" onClick={() => setShowDiagnosisModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleDiagnosisSubmit} disabled={!canManage}>
                Salvar
              </Button>
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
              <Button variant="secondary" onClick={() => setShowCloseModal(false)}>
                Cancelar
              </Button>
              <Button variant="warning" onClick={handleCloseSubmit} disabled={!canManage}>
                Encerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



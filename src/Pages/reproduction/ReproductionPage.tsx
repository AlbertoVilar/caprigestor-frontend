import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import {
  closePregnancy,
  confirmPregnancyPositive,
  createCoverageCorrection,
  createBreeding,
  getActivePregnancy,
  getDiagnosisRecommendation,
  listPregnancies,
  listReproductiveEvents,
  registerNegativeCheck,
} from "../../api/GoatFarmAPI/reproduction";
import { getActiveLactation } from "../../api/GoatFarmAPI/lactation";
import { usePermissions } from "../../Hooks/usePermissions";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type {
  BreedingRequestDTO,
  CoverageCorrectionRequestDTO,
  DiagnosisRecommendationResponseDTO,
  PregnancyCheckRequestDTO,
  PregnancyCloseReason,
  PregnancyCloseRequestDTO,
  PregnancyConfirmRequestDTO,
  PregnancyResponseDTO,
  ReproductiveEventResponseDTO,
} from "../../Models/ReproductionDTOs";
import type { LactationResponseDTO } from "../../Models/LactationDTOs";
import {
  addDaysLocalDate,
  diffDaysLocalDate,
  formatLocalDatePtBR,
  getTodayLocalDate,
} from "../../utils/localDate";
import {
  buildCoverageConflictState,
  type CoverageConflictState,
} from "./reproductionCoverageConflict";
import { buildReproductionTimelineView } from "./reproductionTimeline";
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
  const [activeLactation, setActiveLactation] = useState<LactationResponseDTO | null>(null);
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
  const [breedingConflict, setBreedingConflict] = useState<CoverageConflictState | null>(null);
  const [showBreedingConflictModal, setShowBreedingConflictModal] = useState(false);
  const [showCoverageCorrectionModal, setShowCoverageCorrectionModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [breedingError, setBreedingError] = useState<string | null>(null);
  const [coverageCorrectionError, setCoverageCorrectionError] = useState<string | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [coverageCorrectionSourceEvent, setCoverageCorrectionSourceEvent] =
    useState<ReproductiveEventResponseDTO | null>(null);

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

  const [coverageCorrectionForm, setCoverageCorrectionForm] = useState<CoverageCorrectionRequestDTO>(
    {
      correctedDate: "",
      notes: "",
    }
  );

  const canManage = permissions.isAdmin() || canManageReproduction;
  const hasActivePregnancy = Boolean(activePregnancy);
  const isLateBreedingModal = breedingModalMode === "late";

  const latestCoverageEvent = useMemo(
    () => latestEvents.find((event) => event.eventType === "COVERAGE") || null,
    [latestEvents]
  );
  const latestCoverageEventDate = latestCoverageEvent?.eventDate || null;

  const latestCoverageReferenceDate = useMemo(
    () =>
      recommendation?.lastCoverage?.effectiveDate ||
      recommendation?.lastCoverage?.eventDate ||
      latestCoverageEventDate,
    [recommendation?.lastCoverage?.effectiveDate, recommendation?.lastCoverage?.eventDate, latestCoverageEventDate]
  );

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
  const isBeforeMinDate =
    !!minCheckDate &&
    !!diagnosisForm.checkDate &&
    diffDaysLocalDate(diagnosisForm.checkDate, minCheckDate) > 0;

  const coverageConflictState = useMemo(
    () => buildCoverageConflictState(breedingForm.eventDate, latestCoverageReferenceDate),
    [breedingForm.eventDate, latestCoverageReferenceDate]
  );

  const hasActiveLactation = Boolean(activeLactation);
  const timelineView = useMemo(
    () =>
      buildReproductionTimelineView({
        today: todayLocalDate,
        recommendationCoverageDate,
        minCheckDate,
        recommendationStatus: recommendation?.status || null,
        hasActivePregnancy,
        breedingDate: activePregnancy?.breedingDate || null,
        expectedDueDate: activePregnancy?.expectedDueDate || null,
        hasActiveLactation,
      }),
    [
      activePregnancy?.breedingDate,
      activePregnancy?.expectedDueDate,
      hasActiveLactation,
      hasActivePregnancy,
      minCheckDate,
      recommendation?.status,
      recommendationCoverageDate,
      todayLocalDate,
    ]
  );

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
          ...(hasActiveLactation
            ? [
                {
                  label: "Secagem recomendada",
                  value:
                    activePregnancy.expectedDueDate
                      ? formatLocalDatePtBR(addDaysLocalDate(activePregnancy.expectedDueDate, -90))
                      : activePregnancy.breedingDate
                        ? formatLocalDatePtBR(addDaysLocalDate(activePregnancy.breedingDate, 60))
                        : "-",
                },
              ]
            : []),
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
    hasActiveLactation,
  ]);

  const heroStatusLabel =
    reproductionStatus.tone === "active"
      ? "Gestação ativa"
      : reproductionStatus.tone === "pending"
        ? "Diagnóstico pendente"
        : recommendationCoverageDate
          ? "Em acompanhamento"
          : "Sem gestação ativa";

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
        getActiveLactation(farmIdNumber, goatId),
        getDiagnosisRecommendation(farmIdNumber, goatId),
        listReproductiveEvents(farmIdNumber, goatId, { page: 0, size: 5 }),
        listPregnancies(farmIdNumber, goatId, { page: pageOverride, size: 10 }),
      ]);

      const goatResult = results[0];
      const activeResult = results[1];
      const lactationResult = results[2];
      const recommendationResult = results[3];
      const eventsResult = results[4];
      const pregnanciesResult = results[5];

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

      if (lactationResult.status === "fulfilled") {
        setActiveLactation(lactationResult.value);
      } else {
        setActiveLactation(null);
      }

      if (recommendationResult.status === "fulfilled") {
        setRecommendation(recommendationResult.value);
      } else {
        setRecommendation(null);
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
      getActiveLactation(farmIdNumber, goatId),
      getDiagnosisRecommendation(farmIdNumber, goatId),
      listReproductiveEvents(farmIdNumber, goatId, { page: 0, size: 5 }),
      listPregnancies(farmIdNumber, goatId, { page: pageOverride, size: 10 }),
    ]);

    const activeResult = results[0];
    const lactationResult = results[1];
    const recommendationResult = results[2];
    const eventsResult = results[3];
    const pregnanciesResult = results[4];

    if (activeResult.status === "fulfilled") {
      setActivePregnancy(activeResult.value);
    }

    if (lactationResult.status === "fulfilled") {
      setActiveLactation(lactationResult.value);
    } else {
      setActiveLactation(null);
    }

    if (recommendationResult.status === "fulfilled") {
      setRecommendation(recommendationResult.value);
    } else {
      setRecommendation(null);
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
    setBreedingConflict(coverageConflictState);
    setShowBreedingConflictModal(false);
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
    setBreedingConflict(null);
    setShowBreedingConflictModal(false);
  };

  const openCoverageCorrectionModal = () => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (!latestCoverageEvent) {
      toast.error("Nenhuma cobertura disponível para correção.");
      return;
    }
    setCoverageCorrectionSourceEvent(latestCoverageEvent);
    setCoverageCorrectionForm({
      correctedDate: latestCoverageReferenceDate || latestCoverageEvent.eventDate,
      notes: "",
    });
    setCoverageCorrectionError(null);
    setShowCoverageCorrectionModal(true);
  };

  const closeCoverageCorrectionModal = () => {
    setShowCoverageCorrectionModal(false);
    setCoverageCorrectionSourceEvent(null);
    setCoverageCorrectionError(null);
    setCoverageCorrectionForm({
      correctedDate: "",
      notes: "",
    });
  };

  const getCoverageConflictForDate = (selectedDate?: string): CoverageConflictState =>
    buildCoverageConflictState(selectedDate, latestCoverageReferenceDate);

  const handleBreedingSubmit = async (skipCoverageConfirmation = false) => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (!breedingForm.eventDate) {
      setBreedingError("Informe a data da cobertura.");
      return;
    }

    const coverageConflict = getCoverageConflictForDate(breedingForm.eventDate);
    if (!coverageConflict.canProceed) {
      setBreedingError(coverageConflict.message);
      return;
    }

    if (
      coverageConflict.kind === "later" &&
      !skipCoverageConfirmation &&
      coverageConflict.message !== null
    ) {
      setBreedingConflict(coverageConflict);
      setShowBreedingConflictModal(true);
      return;
    }

    const submittedDate = breedingForm.eventDate;

    try {
      setBreedingError(null);
      await createBreeding(farmIdNumber, goatId!, {
        ...breedingForm,
        breederRef: breedingForm.breederRef || undefined,
        notes: breedingForm.notes || undefined,
      });

      if (submittedDate < (activePregnancyReferenceDate || submittedDate)) {
        toast.info("Cobertura registrada como histórica. O ciclo anterior permanece no histórico.");
      } else if (coverageConflict.kind === "later") {
        toast.success(
          "Cobertura registrada. A contagem para diagnóstico será reiniciada a partir desta data."
        );
      } else {
        toast.success("Cobertura registrada");
      }

      closeBreedingModal();
      resetBreedingForm();
      setShowBreedingConflictModal(false);
      await refreshReproductionState();
    } catch (error) {
      console.error("Erro ao registrar cobertura", error);
      handleFormError(error, setBreedingError);
    }
  };

  const handleCoverageCorrectionSubmit = async () => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (!coverageCorrectionSourceEvent) {
      setCoverageCorrectionError("Cobertura original não encontrada.");
      return;
    }
    if (!coverageCorrectionForm.correctedDate) {
      setCoverageCorrectionError("Informe a data corrigida.");
      return;
    }

    try {
      setCoverageCorrectionError(null);
      await createCoverageCorrection(
        farmIdNumber,
        goatId!,
        coverageCorrectionSourceEvent.id,
        {
          correctedDate: coverageCorrectionForm.correctedDate,
          notes: coverageCorrectionForm.notes || undefined,
        }
      );
      toast.success("Correção de cobertura registrada.");
      closeCoverageCorrectionModal();
      await refreshReproductionState();
    } catch (error) {
      console.error("Erro ao corrigir cobertura", error);
      handleFormError(error, setCoverageCorrectionError);
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
            <div className="repro-hero-meta">
              <span className="repro-section-eyebrow">Reprodução</span>
              <span className="repro-hero-chip">Registro {goatDisplayRegistration}</span>
            </div>
            <p className="repro-hero-breadcrumb">Fazenda / Cabras / Reprodução</p>
            <div className="repro-hero-title-row">
              <h1 className="repro-hero-title">Reprodução</h1>
              <span className={`repro-hero-status-pill repro-hero-status-pill--${reproductionStatus.tone}`}>
                Status atual: {heroStatusLabel}
              </span>
            </div>
            <p className="repro-hero-context">
              Acompanhe o ciclo atual, os marcos do diagnóstico e o histórico reprodutivo desta
              cabra sem sair desta página.
            </p>
            <p className="repro-hero-animal">
              <span className="repro-hero-animal-label">Animal em acompanhamento</span>
              <strong>{goatDisplayName}</strong>
              <span className="repro-hero-animal-meta">Registro {goatDisplayRegistration}</span>
            </p>
          </div>

          <aside className={`repro-status-card repro-status-card--${reproductionStatus.tone}`}>
            <div className="repro-status-heading">
              <span
                className={`repro-status-dot repro-status-dot--${reproductionStatus.tone}`}
                aria-hidden="true"
              ></span>
              <span className="repro-status-eyebrow">{reproductionStatus.eyebrow}</span>
            </div>
            <h3>{reproductionStatus.title}</h3>
            <p>{reproductionStatus.description}</p>
            <div className="repro-status-grid">
              {reproductionStatus.facts.map((fact, index) => (
                <div
                  key={fact.label}
                  className={`repro-status-item ${index === 0 ? "repro-status-item--primary" : ""}`}
                >
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
            <div className="repro-action-stack">
              <div className="repro-action-group">
                <span className="repro-action-group-label">Ações principais</span>
                <div className="repro-primary-actions">
                  <Button
                    variant="primary"
                    className="repro-action-button repro-action-button--coverage"
                    disabled={!canManage}
                    title={!canManage ? "Sem permissão para registrar cobertura." : ""}
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
                </div>
              </div>

              <div className="repro-action-group">
                <span className="repro-action-group-label">Apoio e histórico</span>
                <div className="repro-secondary-actions">
                  <Button
                    variant="outline"
                    className="repro-action-button repro-action-button--support"
                    onClick={() =>
                      navigate(`/app/goatfarms/${farmId}/goats/${goatId}/reproduction/events`)
                    }
                  >
                    <i className="fa-solid fa-timeline" aria-hidden="true"></i>
                    Ver linha do tempo
                  </Button>

                  {latestCoverageEvent && (
                    <Button
                      variant="outline"
                      className="repro-action-button repro-action-button--support"
                      disabled={!canManage}
                      title={!canManage ? "Sem permissão para corrigir cobertura." : ""}
                      onClick={openCoverageCorrectionModal}
                    >
                      <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                      Corrigir última cobertura
                    </Button>
                  )}

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
              </div>
            </div>

            <div className="repro-critical-action">
              <span className="repro-critical-action-label">Encerramento</span>
              <span
                className={`repro-critical-action-state ${hasActivePregnancy ? "repro-critical-action-state--active" : ""}`}
              >
                {hasActivePregnancy ? "Gestação ativa em andamento" : "Sem gestação ativa"}
              </span>
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
          <div className="repro-cycle-panel">
            <div className="repro-cycle-panel-header">
              <div>
                <span className="repro-section-eyebrow repro-section-eyebrow--muted">
                  Acompanhamento
                </span>
                <h2 className="repro-quick-actions-title">Linha do tempo do ciclo atual</h2>
              </div>
            </div>

            {latestCoverageReferenceDate && (
              <p className="repro-action-helper repro-action-helper--warning">
                Já existe cobertura para esta cabra. Coberturas com data posterior mantêm o
                histórico e reiniciam a contagem para diagnóstico.
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
                      {check?.checkDate ? ` em ${formatLocalDatePtBR(check.checkDate)}` : ""}.
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
              </div>
            ) : null}

            {timelineView.show ? (
              <div className="repro-timeline-container">
                <div className="repro-timeline-bar-bg">
                  <div
                    className={`repro-timeline-bar-fill ${timelineView.overdue ? "overdue" : ""}`}
                    style={{ width: `${timelineView.overdue ? 100 : timelineView.progressPercent}%` }}
                  >
                    <div className="repro-timeline-indicator"></div>
                  </div>
                </div>
                <div className="repro-timeline-labels">
                  <span className="repro-timeline-label-start">
                    <span>{timelineView.startLabel}</span>
                    <span className="repro-timeline-date">
                      {timelineView.startDate ? formatLocalDatePtBR(timelineView.startDate) : "-"}
                    </span>
                  </span>
                  <span className="repro-timeline-label-end">
                    <span>{timelineView.endLabel}</span>
                    <span
                      className="repro-timeline-date"
                      style={
                        timelineView.overdue
                          ? { color: "#ef4444", fontWeight: 700 }
                          : undefined
                      }
                    >
                      {timelineView.overdue
                        ? `Atrasado (${timelineView.overdueDays} dias)`
                        : timelineView.endDate
                          ? formatLocalDatePtBR(timelineView.endDate)
                          : "-"}
                    </span>
                  </span>
                </div>
                <div className="repro-timeline-milestones">
                  <div className="repro-timeline-milestone">
                    <span>Início do ciclo</span>
                    <strong>
                      {timelineView.startDate ? formatLocalDatePtBR(timelineView.startDate) : "-"}
                    </strong>
                  </div>
                  <div className="repro-timeline-milestone repro-timeline-milestone--current">
                    <span>Etapa atual</span>
                    <strong>{timelineView.currentStepLabel}</strong>
                  </div>
                  <div className="repro-timeline-milestone repro-timeline-milestone--next">
                    <span>Próximo marco</span>
                    <strong>{timelineView.nextMilestoneLabel}</strong>
                  </div>
                </div>
                <p className="repro-confirm-hint text-muted small" style={{ marginTop: "0.5rem" }}>
                  {timelineView.hint}
                </p>
              </div>
            ) : (
              <p className="repro-confirm-hint text-muted small">{timelineView.hint}</p>
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
          </div>
        </div>
      </section>

      <section className="repro-data-section">
        <div className="repro-section-header">
          <div>
            <span className="repro-section-eyebrow repro-section-eyebrow--muted">
              Resumo
            </span>
            <h2 className="repro-quick-actions-title">Situação detalhada do acompanhamento</h2>
          </div>
        </div>

        <div className="repro-grid">
          {!activePregnancy ? (
            <>
              <div className="repro-card repro-card--highlight">
                <h4>Gestação ativa</h4>
                <p>Sem gestação ativa</p>
              </div>
              {reproductionStatus.facts.map((fact) => (
                <div key={fact.label} className="repro-card">
                  <h4>{fact.label}</h4>
                  <p>{fact.value}</p>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="repro-card repro-card--highlight">
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
        </div>
      </section>

      <section className="repro-list">
        <div className="repro-list-header repro-list-header--events">
          <div>
            <span className="repro-section-eyebrow repro-section-eyebrow--muted">Histórico</span>
            <div className="repro-event-title">Últimos eventos</div>
          </div>
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
        <div className="repro-list-header">
          <div>
            <span className="repro-section-eyebrow repro-section-eyebrow--muted">Gestação</span>
            <h3 style={{ marginTop: 0 }}>Histórico de gestações</h3>
          </div>
        </div>
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
            {breedingConflict?.kind === "sameDay" && breedingError && (
              <p className="repro-breeding-conflict-message repro-breeding-conflict-message--error">
                {breedingError}
              </p>
            )}
            {breedingConflict?.kind === "later" && (
              <p className="repro-breeding-conflict-message repro-breeding-conflict-message--warning">
                {breedingConflict.message}
              </p>
            )}
            {breedingError &&
              breedingConflict?.kind !== "sameDay" &&
              breedingConflict?.kind !== "later" && <p className="text-danger">{breedingError}</p>}
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
                    setShowBreedingConflictModal(false);
                    setBreedingConflict(
                      buildCoverageConflictState(e.target.value, latestCoverageReferenceDate)
                    );
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

      {showBreedingConflictModal && breedingConflict && (
        <div className="repro-modal">
          <div className="repro-modal-content repro-confirmation-modal">
            <h3>Confirmar nova cobertura recente</h3>
            <p className="repro-breeding-conflict-message repro-breeding-conflict-message--warning">
              {breedingConflict.message}
            </p>
            <p className="repro-modal-text">
              Esta ação mantém a cobertura anterior no histórico e reinicia a contagem para diagnóstico
              a partir desta data. Confirme para continuar.
            </p>
            <div className="repro-modal-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowBreedingConflictModal(false);
                  setBreedingConflict(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="warning"
                onClick={() => handleBreedingSubmit(true)}
                disabled={!canManage}
              >
                Confirmar e salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCoverageCorrectionModal && (
        <div className="repro-modal">
          <div className="repro-modal-content">
            <h3>Corrigir cobertura</h3>
            <p className="text-muted small">
              Use esta ação para ajustar uma cobertura já lançada incorretamente.
            </p>
            <div className="repro-form-grid">
              <div>
                <label>Data corrigida</label>
                <input
                  type="date"
                  value={coverageCorrectionForm.correctedDate}
                  onChange={(e) => {
                    setCoverageCorrectionForm((prev) => ({
                      ...prev,
                      correctedDate: e.target.value,
                    }));
                    setCoverageCorrectionError(null);
                  }}
                  disabled={!canManage}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Observações</label>
                <textarea
                  rows={3}
                  value={coverageCorrectionForm.notes || ""}
                  onChange={(e) =>
                    setCoverageCorrectionForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  disabled={!canManage}
                />
              </div>
            </div>
            {coverageCorrectionError && <p className="text-danger">{coverageCorrectionError}</p>}
            <div className="repro-modal-actions">
              <Button variant="secondary" onClick={closeCoverageCorrectionModal}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCoverageCorrectionSubmit}
                disabled={!canManage}
              >
                Salvar correção
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



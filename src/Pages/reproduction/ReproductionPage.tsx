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
  registerBirth,
  registerNegativeCheck,
  registerWeaning,
} from "../../api/GoatFarmAPI/reproduction";
import { usePermissions } from "../../Hooks/usePermissions";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type {
  BirthRequestDTO,
  BreedingRequestDTO,
  DiagnosisRecommendationResponseDTO,
  PregnancyCheckRequestDTO,
  PregnancyCloseReason,
  PregnancyCloseRequestDTO,
  PregnancyConfirmRequestDTO,
  PregnancyResponseDTO,
  ReproductiveEventResponseDTO,
  WeaningRequestDTO,
} from "../../Models/ReproductionDTOs";
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
import { GoatBreedEnum } from "../../types/goatEnums";
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
  COVERAGE_CORRECTION: "Correção de cobertura",
  PREGNANCY_CHECK: "Diagnóstico de prenhez",
  PREGNANCY_CLOSE: "Encerramento de gestação",
  WEANING: "Desmame",
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

type BirthKidForm = {
  registrationNumber: string;
  name: string;
  gender: "MACHO" | "FEMEA";
  breed: string;
  color: string;
  birthDate: string;
  category: "PO" | "PA" | "PC";
};

type BirthFormState = {
  birthDate: string;
  fatherRegistrationNumber: string;
  notes: string;
  kids: BirthKidForm[];
};

const createDefaultKid = (baseBirthDate: string, defaultBreed?: string): BirthKidForm => ({
  registrationNumber: "",
  name: "",
  gender: "FEMEA",
  breed: defaultBreed ?? GoatBreedEnum.SAANEN,
  color: "",
  birthDate: baseBirthDate,
  category: "PA",
});

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
  const [breedingConflict, setBreedingConflict] = useState<CoverageConflictState | null>(null);
  const [showBreedingConflictModal, setShowBreedingConflictModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [showWeaningModal, setShowWeaningModal] = useState(false);
  const [breedingError, setBreedingError] = useState<string | null>(null);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [birthError, setBirthError] = useState<string | null>(null);
  const [weaningError, setWeaningError] = useState<string | null>(null);

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

  const [birthForm, setBirthForm] = useState<BirthFormState>({
    birthDate: getTodayLocalDate(),
    fatherRegistrationNumber: "",
    notes: "",
    kids: [createDefaultKid(getTodayLocalDate())],
  });

  const [weaningForm, setWeaningForm] = useState<WeaningRequestDTO>({
    weaningDate: getTodayLocalDate(),
    notes: "",
  });

  const canManage = permissions.isAdmin() || canManageReproduction;
  const goatOperationalStatus = String(goat?.status ?? "").trim().toUpperCase();
  const isGoatOperationallyActive = ["ATIVO", "ACTIVE"].includes(goatOperationalStatus);
  const canManageOperationalFlows = canManage && isGoatOperationallyActive;
  const hasActivePregnancy = Boolean(activePregnancy);
  const isLateBreedingModal = breedingModalMode === "late";

  const latestCoverageEventDate = useMemo(() => {
    const coverageEvent = latestEvents.find((event) => event.eventType === "COVERAGE");
    return coverageEvent?.eventDate || null;
  }, [latestEvents]);

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
  const daysUntilEligible = minCheckDate ? diffDaysLocalDate(todayLocalDate, minCheckDate) : null;
  const isBeforeMinDate =
    !!minCheckDate &&
    !!diagnosisForm.checkDate &&
    diffDaysLocalDate(diagnosisForm.checkDate, minCheckDate) > 0;

  const coverageConflictState = useMemo(
    () => buildCoverageConflictState(breedingForm.eventDate, latestCoverageReferenceDate),
    [breedingForm.eventDate, latestCoverageReferenceDate]
  );

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

  const timelineElapsedSafeDays = Math.max(0, timelineElapsedDays);
  const timelineCurrentStepLabel =
    recommendation?.status === "ELIGIBLE_PENDING"
      ? `Diagnóstico atrasado (${timelineElapsedSafeDays} dias)`
      : hasActivePregnancy
        ? "Gestação ativa"
        : recommendationCoverageDate
          ? `Dia ${Math.min(timelineElapsedSafeDays, timelineTotalDays)} de ${timelineTotalDays}`
          : "Sem ciclo ativo";
  const timelineNextMilestoneLabel =
    recommendation?.status === "ELIGIBLE_PENDING"
      ? "Registrar diagnóstico"
      : minCheckDate
        ? formatLocalDatePtBR(minCheckDate)
        : "Registrar cobertura";
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
    if (!canManageOperationalFlows) {
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

  const resetBirthForm = () => {
    const today = getTodayLocalDate();
    setBirthForm({
      birthDate: today,
      fatherRegistrationNumber: "",
      notes: "",
      kids: [createDefaultKid(today, goat?.breed)],
    });
  };

  const addBirthKid = () => {
    setBirthForm((prev) => ({
      ...prev,
      kids: [...prev.kids, createDefaultKid(prev.birthDate || getTodayLocalDate(), goat?.breed)],
    }));
  };

  const removeBirthKid = (index: number) => {
    setBirthForm((prev) => {
      if (prev.kids.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        kids: prev.kids.filter((_, kidIndex) => kidIndex !== index),
      };
    });
  };

  const updateBirthKidField = (
    index: number,
    field: keyof BirthKidForm,
    value: string
  ) => {
    setBirthForm((prev) => ({
      ...prev,
      kids: prev.kids.map((kid, kidIndex) =>
        kidIndex === index ? { ...kid, [field]: value } : kid
      ),
    }));
  };

  const getCoverageConflictForDate = (selectedDate?: string): CoverageConflictState =>
    buildCoverageConflictState(selectedDate, latestCoverageReferenceDate);

  const handleBreedingSubmit = async (skipCoverageConfirmation = false) => {
    if (!canManageOperationalFlows) {
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

  const handleDiagnosisSubmit = async () => {
    if (!canManageOperationalFlows) {
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
    if (!canManageOperationalFlows) {
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

  const handleBirthSubmit = async () => {
    if (!canManageOperationalFlows) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (!activePregnancy) {
      setBirthError("Não existe gestação ativa para registrar parto.");
      return;
    }
    if (!birthForm.birthDate) {
      setBirthError("Informe a data do parto.");
      return;
    }
    if (!birthForm.kids.length) {
      setBirthError("Informe ao menos uma cria.");
      return;
    }

    const incompleteKidIndex = birthForm.kids.findIndex(
      (kid) => !kid.registrationNumber.trim() || !kid.name.trim()
    );
    if (incompleteKidIndex >= 0) {
      setBirthError(`Preencha nome e registro da cria ${incompleteKidIndex + 1}.`);
      return;
    }

    try {
      setBirthError(null);
      const payload: BirthRequestDTO = {
        birthDate: birthForm.birthDate,
        fatherRegistrationNumber: birthForm.fatherRegistrationNumber?.trim() || undefined,
        notes: birthForm.notes?.trim() || undefined,
        kids: birthForm.kids.map((kid) => ({
          registrationNumber: kid.registrationNumber.trim(),
          name: kid.name.trim(),
          gender: kid.gender,
          breed: kid.breed || undefined,
          color: kid.color?.trim() || undefined,
          birthDate: kid.birthDate || undefined,
          category: kid.category,
        })),
      };

      const response = await registerBirth(
        farmIdNumber,
        goatId!,
        activePregnancy.id,
        payload
      );

      toast.success(
        `Parto registrado com ${response.kids.length} cria${response.kids.length === 1 ? "" : "s"}.`
      );
      setShowBirthModal(false);
      resetBirthForm();
      await refreshReproductionState();
    } catch (error) {
      console.error("Erro ao registrar parto", error);
      handleFormError(error, setBirthError);
    }
  };

  const handleWeaningSubmit = async () => {
    if (!canManageOperationalFlows) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (!weaningForm.weaningDate) {
      setWeaningError("Informe a data do desmame.");
      return;
    }

    try {
      setWeaningError(null);
      await registerWeaning(farmIdNumber, goatId!, {
        weaningDate: weaningForm.weaningDate,
        notes: weaningForm.notes?.trim() || undefined,
      });
      toast.success("Desmame registrado com sucesso.");
      setShowWeaningModal(false);
      setWeaningForm({
        weaningDate: getTodayLocalDate(),
        notes: "",
      });
      await refreshReproductionState();
    } catch (error) {
      console.error("Erro ao registrar desmame", error);
      handleFormError(error, setWeaningError);
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
              {!isGoatOperationallyActive && (
                <p className="repro-action-helper repro-action-helper--warning">
                  Este animal não está ativo. Operações de escrita ficam bloqueadas.
                </p>
              )}
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
                    disabled={!canManageOperationalFlows}
                    title={!canManageOperationalFlows ? "Sem permissão para registrar cobertura." : ""}
                    onClick={() => openBreedingModal("standard")}
                  >
                    <i className="fa-solid fa-plus" aria-hidden="true"></i>
                    Registrar cobertura
                  </Button>

                  <Button
                    variant={recommendation?.status === "ELIGIBLE_PENDING" ? "primary" : "outline"}
                    className="repro-action-button repro-action-button--diagnosis"
                    disabled={!canManageOperationalFlows}
                    title={!canManageOperationalFlows ? "Sem permissão para registrar diagnóstico." : ""}
                    onClick={() => {
                      if (!canManageOperationalFlows) return;
                      setDiagnosisError(null);
                      setShowDiagnosisModal(true);
                    }}
                  >
                    <i className="fa-solid fa-clipboard-check" aria-hidden="true"></i>
                    Registrar diagnóstico
                  </Button>

                  <Button
                    variant="success"
                    className="repro-action-button repro-action-button--birth"
                    disabled={!canManageOperationalFlows || !hasActivePregnancy}
                    title={
                      !hasActivePregnancy
                        ? "É necessário ter uma gestação ativa para registrar parto."
                        : !canManageOperationalFlows
                          ? "Sem permissão para registrar parto."
                          : ""
                    }
                    onClick={() => {
                      if (!canManageOperationalFlows || !hasActivePregnancy) return;
                      setBirthError(null);
                      setBirthForm((prev) => ({
                        ...prev,
                        birthDate: getTodayLocalDate(),
                        kids:
                          prev.kids.length > 0
                            ? prev.kids.map((kid) => ({
                                ...kid,
                                birthDate: getTodayLocalDate(),
                                breed: kid.breed || goat?.breed || GoatBreedEnum.SAANEN,
                              }))
                            : [createDefaultKid(getTodayLocalDate(), goat?.breed)],
                      }));
                      setShowBirthModal(true);
                    }}
                  >
                    <i className="fa-solid fa-baby" aria-hidden="true"></i>
                    Registrar parto + cria(s)
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

                  {hasActivePregnancy && (
                    <Button
                      variant="outline"
                      className="repro-action-button repro-action-button--support"
                      disabled={!canManageOperationalFlows}
                      title={!canManageOperationalFlows ? "Sem permissão para registrar cobertura antiga." : ""}
                      onClick={() => openBreedingModal("late")}
                    >
                      <i className="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
                      Registrar cobertura antiga
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="repro-action-button repro-action-button--support"
                    disabled={!canManageOperationalFlows}
                    title={!canManageOperationalFlows ? "Sem permissão para registrar desmame." : ""}
                    onClick={() => {
                      if (!canManageOperationalFlows) return;
                      setWeaningError(null);
                      setWeaningForm({
                        weaningDate: getTodayLocalDate(),
                        notes: "",
                      });
                      setShowWeaningModal(true);
                    }}
                  >
                    <i className="fa-solid fa-scissors" aria-hidden="true"></i>
                    Registrar desmame
                  </Button>
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
                disabled={!canManageOperationalFlows || !hasActivePregnancy}
                title={
                  !hasActivePregnancy
                    ? "Sem gestação ativa."
                    : !canManageOperationalFlows
                      ? "Sem permissão para encerrar gestação."
                      : ""
                }
                onClick={() => {
                  if (!canManageOperationalFlows || !hasActivePregnancy) return;
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
                      if (!canManageOperationalFlows) return;
                      setDiagnosisError(null);
                      setShowDiagnosisModal(true);
                    }}
                    disabled={!canManageOperationalFlows}
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
                    <span
                        className="repro-timeline-date"
                        style={{ color: "#ef4444", fontWeight: 700 }}
                      >
                        Atrasado ({timelineElapsedSafeDays} dias)
                      </span>
                    </span>
                  </div>
                  <div className="repro-timeline-milestones">
                    <div className="repro-timeline-milestone">
                      <span>Início do ciclo</span>
                      <strong>
                        {recommendationCoverageDate
                          ? formatLocalDatePtBR(recommendationCoverageDate)
                          : "-"}
                      </strong>
                    </div>
                    <div className="repro-timeline-milestone repro-timeline-milestone--current">
                      <span>Etapa atual</span>
                      <strong>{timelineCurrentStepLabel}</strong>
                    </div>
                    <div className="repro-timeline-milestone repro-timeline-milestone--next">
                      <span>Próximo marco</span>
                      <strong>{timelineNextMilestoneLabel}</strong>
                    </div>
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
                <div className="repro-timeline-milestones">
                  <div className="repro-timeline-milestone">
                    <span>Início do ciclo</span>
                    <strong>{formatLocalDatePtBR(recommendationCoverageDate)}</strong>
                  </div>
                  <div className="repro-timeline-milestone repro-timeline-milestone--current">
                    <span>Etapa atual</span>
                    <strong>{timelineCurrentStepLabel}</strong>
                  </div>
                  <div className="repro-timeline-milestone repro-timeline-milestone--next">
                    <span>Próximo marco</span>
                    <strong>{timelineNextMilestoneLabel}</strong>
                  </div>
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
                  disabled={!canManageOperationalFlows}
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
                  disabled={!canManageOperationalFlows}
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
                  disabled={!canManageOperationalFlows}
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
                  disabled={!canManageOperationalFlows}
                />
              </div>
            </div>
            <div className="repro-modal-actions">
              <Button variant="secondary" onClick={closeBreedingModal}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleBreedingSubmit} disabled={!canManageOperationalFlows}>
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
                disabled={!canManageOperationalFlows}
              >
                Confirmar e salvar
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
                  disabled={!canManageOperationalFlows}
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
                  disabled={!canManageOperationalFlows}
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
                  disabled={!canManageOperationalFlows}
                />
              </div>
            </div>
            <div className="repro-modal-actions">
              <Button variant="secondary" onClick={() => setShowDiagnosisModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleDiagnosisSubmit} disabled={!canManageOperationalFlows}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBirthModal && (
        <div className="repro-modal">
          <div className="repro-modal-content">
            <h3>Registrar parto e cria(s)</h3>
            <p className="repro-modal-text">
              Informe os dados mínimos das crias para concluir o fechamento do parto.
            </p>
            <div className="repro-form-grid">
              <div>
                <label>Data do parto</label>
                <input
                  type="date"
                  value={birthForm.birthDate}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    setBirthForm((prev) => ({
                      ...prev,
                      birthDate: dateValue,
                      kids: prev.kids.map((kid) => ({ ...kid, birthDate: dateValue })),
                    }));
                    setBirthError(null);
                  }}
                  max={todayLocalDate}
                  disabled={!canManageOperationalFlows}
                />
              </div>
              <div>
                <label>Registro do pai (opcional)</label>
                <input
                  type="text"
                  value={birthForm.fatherRegistrationNumber ?? ""}
                  onChange={(e) =>
                    setBirthForm((prev) => ({
                      ...prev,
                      fatherRegistrationNumber: e.target.value,
                    }))
                  }
                  disabled={!canManageOperationalFlows}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Observações</label>
                <textarea
                  rows={2}
                  value={birthForm.notes ?? ""}
                  onChange={(e) =>
                    setBirthForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  disabled={!canManageOperationalFlows}
                />
              </div>
            </div>

            <div className="repro-kids-list">
              {birthForm.kids.map((kid, index) => (
                <div key={`birth-kid-${index}`} className="repro-kid-card">
                  <div className="repro-kid-card__header">
                    <h4>Cria {index + 1}</h4>
                    {birthForm.kids.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBirthKid(index)}
                        disabled={!canManageOperationalFlows}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                  <div className="repro-form-grid">
                    <div>
                      <label>Registro</label>
                      <input
                        type="text"
                        value={kid.registrationNumber}
                        onChange={(event) =>
                          updateBirthKidField(index, "registrationNumber", event.target.value)
                        }
                        disabled={!canManageOperationalFlows}
                      />
                    </div>
                    <div>
                      <label>Nome</label>
                      <input
                        type="text"
                        value={kid.name}
                        onChange={(event) => updateBirthKidField(index, "name", event.target.value)}
                        disabled={!canManageOperationalFlows}
                      />
                    </div>
                    <div>
                      <label>Sexo</label>
                      <select
                        value={kid.gender}
                        onChange={(event) => updateBirthKidField(index, "gender", event.target.value)}
                        disabled={!canManageOperationalFlows}
                      >
                        <option value="FEMEA">Fêmea</option>
                        <option value="MACHO">Macho</option>
                      </select>
                    </div>
                    <div>
                      <label>Raça</label>
                      <select
                        value={kid.breed}
                        onChange={(event) => updateBirthKidField(index, "breed", event.target.value)}
                        disabled={!canManageOperationalFlows}
                      >
                        {Object.values(GoatBreedEnum).map((breed) => (
                          <option key={breed} value={breed}>
                            {breed}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Categoria</label>
                      <select
                        value={kid.category}
                        onChange={(event) =>
                          updateBirthKidField(index, "category", event.target.value)
                        }
                        disabled={!canManageOperationalFlows}
                      >
                        <option value="PA">PA</option>
                        <option value="PO">PO</option>
                        <option value="PC">PC</option>
                      </select>
                    </div>
                    <div>
                      <label>Cor</label>
                      <input
                        type="text"
                        value={kid.color}
                        onChange={(event) => updateBirthKidField(index, "color", event.target.value)}
                        disabled={!canManageOperationalFlows}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {birthError && <p className="text-danger">{birthError}</p>}

            <div className="repro-modal-actions">
              <Button
                variant="outline"
                onClick={addBirthKid}
                disabled={!canManageOperationalFlows}
              >
                Adicionar cria
              </Button>
              <Button variant="secondary" onClick={() => setShowBirthModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={handleBirthSubmit}
                disabled={!canManageOperationalFlows}
              >
                Confirmar parto
              </Button>
            </div>
          </div>
        </div>
      )}

      {showWeaningModal && (
        <div className="repro-modal">
          <div className="repro-modal-content">
            <h3>Registrar desmame</h3>
            <div className="repro-form-grid">
              <div>
                <label>Data do desmame</label>
                <input
                  type="date"
                  value={weaningForm.weaningDate}
                  onChange={(event) => {
                    setWeaningForm((prev) => ({
                      ...prev,
                      weaningDate: event.target.value,
                    }));
                    setWeaningError(null);
                  }}
                  max={todayLocalDate}
                  disabled={!canManageOperationalFlows}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Observações</label>
                <textarea
                  rows={3}
                  value={weaningForm.notes ?? ""}
                  onChange={(event) =>
                    setWeaningForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  disabled={!canManageOperationalFlows}
                />
              </div>
            </div>
            {weaningError && <p className="text-danger">{weaningError}</p>}
            <div className="repro-modal-actions">
              <Button variant="secondary" onClick={() => setShowWeaningModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleWeaningSubmit}
                disabled={!canManageOperationalFlows}
              >
                Confirmar desmame
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
                  disabled={!canManageOperationalFlows}
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
                  disabled={!canManageOperationalFlows}
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
                  disabled={!canManageOperationalFlows}
                />
              </div>
            </div>
            <div className="repro-modal-actions">
              <Button variant="secondary" onClick={() => setShowCloseModal(false)}>
                Cancelar
              </Button>
              <Button variant="warning" onClick={handleCloseSubmit} disabled={!canManageOperationalFlows}>
                Encerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




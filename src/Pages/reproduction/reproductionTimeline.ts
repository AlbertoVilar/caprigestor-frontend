import { addDaysLocalDate, diffDaysLocalDate, formatLocalDatePtBR } from "../../utils/localDate";

export type ReproductionTimelineMode = "NONE" | "DIAGNOSIS" | "GESTATION" | "DRY_OFF";

type BuildReproductionTimelineViewInput = {
  today: string;
  recommendationCoverageDate?: string | null;
  minCheckDate?: string | null;
  recommendationStatus?: "NOT_ELIGIBLE" | "ELIGIBLE_PENDING" | "RESOLVED" | null;
  hasActivePregnancy: boolean;
  breedingDate?: string | null;
  expectedDueDate?: string | null;
  hasActiveLactation: boolean;
};

export type ReproductionTimelineView = {
  mode: ReproductionTimelineMode;
  show: boolean;
  startLabel: string;
  endLabel: string;
  startDate: string | null;
  endDate: string | null;
  progressPercent: number;
  overdue: boolean;
  overdueDays: number;
  currentStepLabel: string;
  nextMilestoneLabel: string;
  hint: string;
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const buildEmptyTimeline = (): ReproductionTimelineView => ({
  mode: "NONE",
  show: false,
  startLabel: "Início",
  endLabel: "Próximo marco",
  startDate: null,
  endDate: null,
  progressPercent: 0,
  overdue: false,
  overdueDays: 0,
  currentStepLabel: "Sem ciclo ativo",
  nextMilestoneLabel: "Registrar cobertura",
  hint: "Sem cobertura registrada para recomendação de diagnóstico.",
});

const buildProgress = (startDate: string, endDate: string, today: string) => {
  const totalDays = Math.max(1, diffDaysLocalDate(startDate, endDate));
  const elapsedDays = Math.max(0, diffDaysLocalDate(startDate, today));
  return {
    totalDays,
    elapsedDays,
    progressPercent: clampPercent((elapsedDays / totalDays) * 100),
    overdueDays: Math.max(0, diffDaysLocalDate(endDate, today)),
  };
};

export const buildReproductionTimelineView = (
  input: BuildReproductionTimelineViewInput
): ReproductionTimelineView => {
  const {
    today,
    recommendationCoverageDate,
    minCheckDate,
    recommendationStatus,
    hasActivePregnancy,
    breedingDate,
    expectedDueDate,
    hasActiveLactation,
  } = input;

  const cycleStart = breedingDate || recommendationCoverageDate || null;
  if (!cycleStart) {
    return buildEmptyTimeline();
  }

  if (hasActivePregnancy) {
    if (hasActiveLactation) {
      const dryOffDate = expectedDueDate
        ? addDaysLocalDate(expectedDueDate, -90)
        : addDaysLocalDate(cycleStart, 60);
      const progress = buildProgress(cycleStart, dryOffDate, today);
      const isOverdue = progress.overdueDays > 0;

      return {
        mode: "DRY_OFF",
        show: true,
        startLabel: "Cobertura",
        endLabel: "Secagem (90 dias antes do parto)",
        startDate: cycleStart,
        endDate: dryOffDate,
        progressPercent: progress.progressPercent,
        overdue: isOverdue,
        overdueDays: progress.overdueDays,
        currentStepLabel: isOverdue
          ? `Secagem atrasada (${progress.overdueDays} dias)`
          : "Gestação ativa em lactação",
        nextMilestoneLabel: isOverdue ? "Secar lactação" : formatLocalDatePtBR(dryOffDate),
        hint: "Com gestação e lactação ativas, prepare a secagem 90 dias antes do parto.",
      };
    }

    const dueDate = expectedDueDate || addDaysLocalDate(cycleStart, 150);
    const progress = buildProgress(cycleStart, dueDate, today);
    const isOverdue = progress.overdueDays > 0;

    return {
      mode: "GESTATION",
      show: true,
      startLabel: "Cobertura",
      endLabel: "Parto previsto",
      startDate: cycleStart,
      endDate: dueDate,
      progressPercent: progress.progressPercent,
      overdue: isOverdue,
      overdueDays: progress.overdueDays,
      currentStepLabel: isOverdue
        ? `Parto previsto atrasado (${progress.overdueDays} dias)`
        : "Gestação ativa",
      nextMilestoneLabel: formatLocalDatePtBR(dueDate),
      hint: "Acompanhando a gestação ativa até o parto previsto.",
    };
  }

  const diagnosisDate = minCheckDate || addDaysLocalDate(cycleStart, 60);
  const progress = buildProgress(cycleStart, diagnosisDate, today);
  const isPending = recommendationStatus === "ELIGIBLE_PENDING";
  const isOverdue = isPending || progress.overdueDays > 0;

  return {
    mode: "DIAGNOSIS",
    show: true,
    startLabel: "Cobertura",
    endLabel: "Diagnóstico",
    startDate: cycleStart,
    endDate: diagnosisDate,
    progressPercent: progress.progressPercent,
    overdue: isOverdue,
    overdueDays: progress.overdueDays,
    currentStepLabel: isOverdue
      ? `Diagnóstico atrasado (${progress.overdueDays} dias)`
      : `Dia ${Math.min(progress.elapsedDays, progress.totalDays)} de ${progress.totalDays}`,
    nextMilestoneLabel: isOverdue ? "Registrar diagnóstico" : formatLocalDatePtBR(diagnosisDate),
    hint:
      progress.overdueDays > 0 || isPending
        ? "Prazo mínimo atingido. Registre o diagnóstico."
        : `Faltam ${Math.max(0, diffDaysLocalDate(today, diagnosisDate))} dia${
            diffDaysLocalDate(today, diagnosisDate) === 1 ? "" : "s"
          } para o diagnóstico.`,
  };
};

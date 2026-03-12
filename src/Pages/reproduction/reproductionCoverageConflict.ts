import { diffDaysLocalDate, formatLocalDatePtBR } from "../../utils/localDate";

export type CoverageConflictState =
  | {
      kind: "none";
      requiresConfirmation: false;
      canProceed: true;
      message: null;
      lastCoverageDate: null;
      daysSinceLastCoverage: null;
    }
  | {
      kind: "sameDay";
      requiresConfirmation: false;
      canProceed: false;
      message: string;
      lastCoverageDate: string;
      daysSinceLastCoverage: number;
    }
  | {
      kind: "later";
      requiresConfirmation: true;
      canProceed: true;
      message: string;
      lastCoverageDate: string;
      daysSinceLastCoverage: number;
    };

const coverageAlreadySavedMessage = (
  daysSinceLastCoverage: number,
  lastCoverageDate: string
) =>
  `Já existe uma cobertura registrada para esta cabra há ${daysSinceLastCoverage} dia${
    daysSinceLastCoverage > 1 ? "s" : ""
  } (${formatLocalDatePtBR(
    lastCoverageDate
  )}). Registrar uma nova cobertura reiniciará a contagem para diagnóstico e manterá a anterior no histórico.`;

export const buildCoverageConflictState = (
  selectedDate?: string,
  lastCoverageDate?: string | null
): CoverageConflictState => {
  if (!selectedDate || !lastCoverageDate) {
    return {
      kind: "none",
      requiresConfirmation: false,
      canProceed: true,
      message: null,
      lastCoverageDate: null,
      daysSinceLastCoverage: null,
    };
  }

  const daysSinceLastCoverage = diffDaysLocalDate(lastCoverageDate, selectedDate);

  if (daysSinceLastCoverage === 0) {
    return {
      kind: "sameDay",
      requiresConfirmation: false,
      canProceed: false,
      message:
        "Já existe uma cobertura registrada para esta cabra hoje. Use a correção de cobertura se precisar ajustar o lançamento.",
      lastCoverageDate,
      daysSinceLastCoverage: 0,
    };
  }

  if (daysSinceLastCoverage > 0) {
    return {
      kind: "later",
      requiresConfirmation: true,
      canProceed: true,
      message: coverageAlreadySavedMessage(daysSinceLastCoverage, lastCoverageDate),
      lastCoverageDate,
      daysSinceLastCoverage,
    };
  }

  return {
    kind: "none",
    requiresConfirmation: false,
    canProceed: true,
    message: null,
    lastCoverageDate: null,
    daysSinceLastCoverage: null,
  };
};

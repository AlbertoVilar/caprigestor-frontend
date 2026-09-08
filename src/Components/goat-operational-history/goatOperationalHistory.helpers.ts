import type { OperationalAuditEntryDTO } from "../../Models/OperationalAuditDTOs";
import type { GoatExitType } from "../../api/GoatAPI/goat";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type {
  PregnancyResponseDTO,
  ReproductiveEventResponseDTO,
} from "../../Models/ReproductionDTOs";

export type TimelineItem = {
  key: string;
  date?: string | null;
  title: string;
  detail: string;
  tone: "neutral" | "success" | "warning";
};

export function selectTimelineItems(
  timeline: TimelineItem[],
  showCompleteHistory: boolean,
  limit = 3,
): TimelineItem[] {
  return showCompleteHistory ? timeline : timeline.slice(0, limit);
}

const exitTypeLabels: Record<GoatExitType, string> = {
  VENDA: "Venda",
  MORTE: "Morte",
  DESCARTE: "Descarte",
  DOACAO: "Doação",
  TRANSFERENCIA: "Transferência",
};

const closeReasonLabels: Record<string, string> = {
  BIRTH: "Parto",
  ABORTION: "Aborto",
  LOSS: "Perda gestacional",
  FALSE_POSITIVE: "Falso positivo",
  OTHER: "Outro encerramento",
  DATA_FIX_DUPLICATED_ACTIVE: "Correção de duplicidade",
};

export function buildOperationalTimeline(
  goat: GoatResponseDTO,
  events: ReproductiveEventResponseDTO[],
  pregnancies: PregnancyResponseDTO[],
  auditEntries: OperationalAuditEntryDTO[] = []
): TimelineItem[] {
  const pregnancyById = new Map(pregnancies.map((item) => [item.id, item]));
  const items: TimelineItem[] = [
    {
      key: `birth-${goat.registrationNumber}`,
      date: goat.birthDate,
      title: "Nascimento",
      detail: `${goat.name} entrou no histórico da fazenda.`,
      tone: "success",
    },
    ...events.map((event) => {
      const pregnancy = event.pregnancyId
        ? pregnancyById.get(event.pregnancyId)
        : undefined;
      if (event.eventType === "PREGNANCY_CLOSE") {
        return {
          key: `event-${event.id}`,
          date: event.eventDate,
          title:
            pregnancy?.closeReason === "BIRTH"
              ? "Parto registrado"
              : "Encerramento de gestação",
          detail:
            (pregnancy?.closeReason
              ? closeReasonLabels[pregnancy.closeReason] ?? pregnancy.closeReason
              : null) ??
            event.notes ??
            "Marco reprodutivo finalizado.",
          tone: (pregnancy?.closeReason === "BIRTH" ? "success" : "warning") as TimelineItem["tone"],
        };
      }
      if (event.eventType === "PREGNANCY_CHECK") {
        return {
          key: `event-${event.id}`,
          date: event.eventDate,
          title: `Diagnóstico de prenhez${event.checkResult ? ` (${event.checkResult})` : ""}`,
          detail: event.notes ?? "Avaliação reprodutiva registrada.",
          tone: (event.checkResult === "POSITIVE" ? "success" : "neutral") as TimelineItem["tone"],
        };
      }
      return {
        key: `event-${event.id}`,
        date: event.eventDate,
        title: event.eventType === "WEANING" ? "Desmame registrado" : "Cobertura registrada",
        detail:
          event.breedingType === "AI"
            ? "Inseminação artificial"
            : event.breedingType === "NATURAL"
              ? "Cobertura natural"
              : event.notes ?? "Marco operacional registrado.",
        tone: (event.eventType === "WEANING" ? "success" : "neutral") as TimelineItem["tone"],
      };
    }),
    ...(goat.exitDate
      ? [{
          key: `exit-${goat.registrationNumber}`,
          date: goat.exitDate,
          title: "Saída do rebanho",
          detail: `${exitTypeLabels[(goat.exitType as GoatExitType) ?? "VENDA"] ?? goat.exitType ?? "Saída"}${goat.exitNotes ? `  -  ${goat.exitNotes}` : ""}`,
          tone: "warning" as const,
        }]
      : []),
    ...auditEntries.map((entry) => ({
      key: `audit-${entry.id}`,
      date: entry.createdAt?.split("T")[0] ?? null,
      title: entry.actionLabel,
      detail: `${entry.description} - por ${entry.actorName}`,
      tone: (entry.actionType === "GOAT_EXIT"
        ? "warning"
        : entry.actionType.endsWith("_PAYMENT_REGISTERED")
          ? "success"
          : "neutral") as TimelineItem["tone"],
    })),
  ];

  return items.sort((left, right) => (right.date ?? "").localeCompare(left.date ?? ""));
}

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

const exitTypeLabels: Record<GoatExitType, string> = {
  VENDA: "Venda",
  MORTE: "Morte",
  DESCARTE: "Descarte",
  DOACAO: "Doacao",
  TRANSFERENCIA: "Transferencia",
};

const closeReasonLabels: Record<string, string> = {
  BIRTH: "Parto",
  ABORTION: "Aborto",
  LOSS: "Perda gestacional",
  FALSE_POSITIVE: "Falso positivo",
  OTHER: "Outro encerramento",
  DATA_FIX_DUPLICATED_ACTIVE: "Correcao de duplicidade",
};

export function buildOperationalTimeline(
  goat: GoatResponseDTO,
  events: ReproductiveEventResponseDTO[],
  pregnancies: PregnancyResponseDTO[]
): TimelineItem[] {
  const pregnancyById = new Map(pregnancies.map((item) => [item.id, item]));
  const items: TimelineItem[] = [
    {
      key: `birth-${goat.registrationNumber}`,
      date: goat.birthDate,
      title: "Nascimento",
      detail: `${goat.name} entrou no historico local da fazenda.`,
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
              : "Encerramento de gestacao",
          detail:
            (pregnancy?.closeReason
              ? closeReasonLabels[pregnancy.closeReason] ?? pregnancy.closeReason
              : null) ??
            event.notes ??
            "Marco reprodutivo finalizado.",
          tone: pregnancy?.closeReason === "BIRTH" ? "success" : "warning",
        };
      }
      if (event.eventType === "PREGNANCY_CHECK") {
        return {
          key: `event-${event.id}`,
          date: event.eventDate,
          title: `Diagnostico de prenhez${event.checkResult ? ` (${event.checkResult})` : ""}`,
          detail: event.notes ?? "Avaliacao reprodutiva registrada.",
          tone: event.checkResult === "POSITIVE" ? "success" : "neutral",
        };
      }
      return {
        key: `event-${event.id}`,
        date: event.eventDate,
        title: event.eventType === "WEANING" ? "Desmame registrado" : "Cobertura registrada",
        detail:
          event.breedingType === "AI"
            ? "Inseminacao artificial"
            : event.breedingType === "NATURAL"
              ? "Cobertura natural"
              : event.notes ?? "Marco operacional registrado.",
        tone: event.eventType === "WEANING" ? "success" : "neutral",
      };
    }),
    ...(goat.exitDate
      ? [{
          key: `exit-${goat.registrationNumber}`,
          date: goat.exitDate,
          title: "Saida do rebanho",
          detail: `${exitTypeLabels[(goat.exitType as GoatExitType) ?? "VENDA"] ?? goat.exitType ?? "Saida"}${goat.exitNotes ? `  -  ${goat.exitNotes}` : ""}`,
          tone: "warning" as const,
        }]
      : []),
  ];

  return items.sort((left, right) => (right.date ?? "").localeCompare(left.date ?? ""));
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listGoatOffspring, type GoatExitType } from "../../api/GoatAPI/goat";
import {
  listPregnancies,
  listReproductiveEvents,
} from "../../api/GoatFarmAPI/reproduction";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type {
  PregnancyResponseDTO,
  ReproductiveEventResponseDTO,
} from "../../Models/ReproductionDTOs";
import { buildOperationalTimeline } from "./goatOperationalHistory.helpers";

type Props = {
  goat: GoatResponseDTO;
  farmId: number;
  farmOwnerId?: number;
};

const exitTypeLabels: Record<GoatExitType, string> = {
  VENDA: "Venda",
  MORTE: "Morte",
  DESCARTE: "Descarte",
  DOACAO: "Doacao",
  TRANSFERENCIA: "Transferencia",
};

const formatDate = (value?: string | null) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "-";

export default function GoatOperationalHistoryPanel({
  goat,
  farmId,
  farmOwnerId,
}: Props) {
  const [events, setEvents] = useState<ReproductiveEventResponseDTO[]>([]);
  const [pregnancies, setPregnancies] = useState<PregnancyResponseDTO[]>([]);
  const [offspring, setOffspring] = useState<GoatResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setWarning(null);
      const [eventsResult, pregnanciesResult, offspringResult] =
        await Promise.allSettled([
          listReproductiveEvents(farmId, goat.registrationNumber, { page: 0, size: 50 }),
          listPregnancies(farmId, goat.registrationNumber, { page: 0, size: 50 }),
          listGoatOffspring(farmId, goat.registrationNumber),
        ]);

      if (cancelled) return;

      const failed: string[] = [];
      if (eventsResult.status === "fulfilled") setEvents(eventsResult.value.content ?? []);
      else { setEvents([]); failed.push("eventos reprodutivos"); }
      if (pregnanciesResult.status === "fulfilled") setPregnancies(pregnanciesResult.value.content ?? []);
      else { setPregnancies([]); failed.push("gestacoes"); }
      if (offspringResult.status === "fulfilled") setOffspring(offspringResult.value);
      else { setOffspring([]); failed.push("crias vinculadas"); }

      setWarning(failed.length ? `Parte do historico nao pode ser carregada agora (${failed.join(", ")}).` : null);
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [farmId, goat.registrationNumber]);

  const timeline = useMemo(
    () => buildOperationalTimeline(goat, events, pregnancies),
    [events, goat, pregnancies]
  );
  const lastCoverage = useMemo(
    () => events.filter((item) => item.eventType === "COVERAGE").map((item) => item.eventDate).sort((a, b) => b.localeCompare(a))[0] ?? null,
    [events]
  );
  const lastWeaning = useMemo(
    () => events.filter((item) => item.eventType === "WEANING").map((item) => item.eventDate).sort((a, b) => b.localeCompare(a))[0] ?? null,
    [events]
  );
  const lastBirth = useMemo(
    () => pregnancies.filter((item) => item.closeReason === "BIRTH" && item.closeDate).map((item) => item.closeDate as string).sort((a, b) => b.localeCompare(a))[0] ?? null,
    [pregnancies]
  );
  const activePregnancy = pregnancies.find((item) => item.status === "ACTIVE") ?? null;
  const isOperationallyActive = ["ATIVO", "ACTIVE"].includes(String(goat.status ?? "").trim().toUpperCase());

  return (
    <div className="animal-operational-history">
      <section className={`animal-status-banner ${isOperationallyActive ? "animal-status-banner--active" : "animal-status-banner--inactive"}`}>
        <strong>{isOperationallyActive ? "Animal em operacao" : "Animal fora de operacao"}</strong>
        <span>{isOperationallyActive ? "Fluxos de manejo e reproducao seguem liberados conforme permissoes e regras do dominio." : `Status atual: ${String(goat.status ?? "-")}. Escritas operacionais ficam bloqueadas.`}</span>
      </section>

      <section className="animal-cycle-grid" aria-label="Resumo operacional do ciclo">
        <article className="animal-cycle-card"><span className="animal-cycle-card__label">Situacao operacional</span><strong>{String(goat.status ?? "-")}</strong><small>{activePregnancy ? `Gestacao ativa desde ${formatDate(activePregnancy.confirmDate)}` : "Sem gestacao ativa aberta no historico local."}</small></article>
        <article className="animal-cycle-card"><span className="animal-cycle-card__label">Ultima cobertura</span><strong>{formatDate(lastCoverage)}</strong><small>{lastCoverage ? "Ultimo marco de cobertura consolidado no historico local." : "Nenhuma cobertura registrada localmente."}</small></article>
        <article className="animal-cycle-card"><span className="animal-cycle-card__label">Ultimo parto / desmame</span><strong>{lastBirth ? formatDate(lastBirth) : "-"}</strong><small>{lastWeaning ? `Desmame mais recente em ${formatDate(lastWeaning)}.` : "Sem desmame registrado ate o momento."}</small></article>
        <article className="animal-cycle-card"><span className="animal-cycle-card__label">Saida do rebanho</span><strong>{goat.exitDate ? formatDate(goat.exitDate) : "Em operacao"}</strong><small>{goat.exitDate ? `${exitTypeLabels[(goat.exitType as GoatExitType) ?? "VENDA"] ?? goat.exitType ?? "Saida registrada"}${goat.exitNotes ? `  -  ${goat.exitNotes}` : ""}` : "Sem saida controlada registrada."}</small></article>
      </section>

      <section className="animal-history-panel">
        <div className="animal-history-panel__header"><div><span className="animal-history-panel__eyebrow">Historico</span><h3>Marcos do ciclo do animal</h3></div><span className="animal-history-panel__meta">{timeline.length} registro(s)</span></div>
        {loading ? <div className="animal-history-panel__empty">Carregando historico operacional...</div> : timeline.length > 0 ? (
          <ol className="animal-history-timeline">
            {timeline.map((item) => (
              <li key={item.key} className={`animal-history-timeline__item animal-history-timeline__item--${item.tone}`}>
                <div className="animal-history-timeline__date">{formatDate(item.date)}</div>
                <div className="animal-history-timeline__content"><strong>{item.title}</strong><p>{item.detail}</p></div>
              </li>
            ))}
          </ol>
        ) : <div className="animal-history-panel__empty">Ainda nao ha marcos suficientes para compor o historico operacional deste animal.</div>}
        {warning ? <p className="animal-history-panel__warning">{warning}</p> : null}
      </section>

      <section className="animal-history-panel">
        <div className="animal-history-panel__header"><div><span className="animal-history-panel__eyebrow">Genealogia local</span><h3>Crias vinculadas</h3></div><span className="animal-history-panel__meta">{offspring.length} cria(s)</span></div>
        {loading ? <div className="animal-history-panel__empty">Carregando crias vinculadas...</div> : offspring.length > 0 ? (
          <div className="animal-offspring-list">
            {offspring.map((kid) => (
              <Link
                key={kid.registrationNumber}
                to={`/app/goatfarms/${farmId}/goats/${kid.registrationNumber}`}
                state={{ goat: kid, farmId, farmOwnerId }}
                className="animal-offspring-card"
              >
                <strong>{kid.name}</strong>
                <span>Registro {kid.registrationNumber}</span>
                <span>{kid.gender}  -  {kid.status}</span>
                <span>Nascimento {formatDate(kid.birthDate)}</span>
              </Link>
            ))}
          </div>
        ) : <div className="animal-history-panel__empty">Nenhuma cria local vinculada a este animal na fazenda atual.</div>}
      </section>
    </div>
  );
}

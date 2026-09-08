import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { listOperationalAuditEntries } from "../../api/AuditAPI/audit";
import { listGoatOffspring, type GoatExitType } from "../../api/GoatAPI/goat";
import {
  listPregnancies,
  listReproductiveEvents,
} from "../../api/GoatFarmAPI/reproduction";
import type { GoatWithdrawalStatusDTO } from "../../Models/HealthDTOs";
import type { OperationalAuditEntryDTO } from "../../Models/OperationalAuditDTOs";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type {
  PregnancyResponseDTO,
  ReproductiveEventResponseDTO,
} from "../../Models/ReproductionDTOs";
import {
  buildOperationalTimeline,
  selectTimelineItems,
} from "./goatOperationalHistory.helpers";

type Props = {
  goat: GoatResponseDTO;
  farmId: number;
  farmOwnerId?: number;
};

const exitTypeLabels: Record<GoatExitType, string> = {
  VENDA: "Venda",
  MORTE: "Morte",
  DESCARTE: "Descarte",
  DOACAO: "Doação",
  TRANSFERENCIA: "Transferência",
};

const INITIAL_TIMELINE_ITEMS = 3;

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
  const [auditEntries, setAuditEntries] = useState<OperationalAuditEntryDTO[]>([]);
  const [withdrawalStatus, setWithdrawalStatus] = useState<GoatWithdrawalStatusDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [showCompleteHistory, setShowCompleteHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setShowCompleteHistory(false);
      setLoading(true);
      setWarning(null);
      const [eventsResult, pregnanciesResult, offspringResult, auditResult, withdrawalResult] =
        await Promise.allSettled([
          listReproductiveEvents(farmId, goat.registrationNumber, { page: 0, size: 50 }),
          listPregnancies(farmId, goat.registrationNumber, { page: 0, size: 50 }),
          listGoatOffspring(farmId, goat.registrationNumber),
          listOperationalAuditEntries(farmId, { goatId: goat.registrationNumber, limit: 20 }),
          healthAPI.getWithdrawalStatus(farmId, goat.registrationNumber),
        ]);

      if (cancelled) return;

      const failed: string[] = [];
      if (eventsResult.status === "fulfilled") setEvents(eventsResult.value.content ?? []);
      else {
        setEvents([]);
        failed.push("eventos reprodutivos");
      }
      if (pregnanciesResult.status === "fulfilled") setPregnancies(pregnanciesResult.value.content ?? []);
      else {
        setPregnancies([]);
        failed.push("gestações");
      }
      if (offspringResult.status === "fulfilled") setOffspring(offspringResult.value);
      else {
        setOffspring([]);
        failed.push("crias vinculadas");
      }
      if (auditResult.status === "fulfilled") setAuditEntries(auditResult.value);
      else {
        setAuditEntries([]);
        failed.push("auditoria operacional");
      }
      if (withdrawalResult.status === "fulfilled") setWithdrawalStatus(withdrawalResult.value);
      else {
        setWithdrawalStatus(null);
        failed.push("carência sanitária");
      }

      setWarning(
        failed.length
          ? `Parte do histórico não pôde ser carregada (${failed.join(", ")}).`
          : null
      );
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [farmId, goat.registrationNumber]);

  const timeline = useMemo(
    () => buildOperationalTimeline(goat, events, pregnancies, auditEntries),
    [auditEntries, events, goat, pregnancies]
  );
  const lastCoverage = useMemo(
    () =>
      events
        .filter((item) => item.eventType === "COVERAGE")
        .map((item) => item.eventDate)
        .sort((a, b) => b.localeCompare(a))[0] ?? null,
    [events]
  );
  const lastWeaning = useMemo(
    () =>
      events
        .filter((item) => item.eventType === "WEANING")
        .map((item) => item.eventDate)
        .sort((a, b) => b.localeCompare(a))[0] ?? null,
    [events]
  );
  const lastBirth = useMemo(
    () =>
      pregnancies
        .filter((item) => item.closeReason === "BIRTH" && item.closeDate)
        .map((item) => item.closeDate as string)
        .sort((a, b) => b.localeCompare(a))[0] ?? null,
    [pregnancies]
  );
  const activePregnancy = pregnancies.find((item) => item.status === "ACTIVE") ?? null;
  const isOperationallyActive = ["ATIVO", "ACTIVE"].includes(
    String(goat.status ?? "").trim().toUpperCase()
  );
  const hasActiveWithdrawal =
    withdrawalStatus?.hasActiveMilkWithdrawal || withdrawalStatus?.hasActiveMeatWithdrawal;
  const visibleTimeline = selectTimelineItems(
    timeline,
    showCompleteHistory,
    INITIAL_TIMELINE_ITEMS,
  );
  const hiddenTimelineItems = Math.max(timeline.length - visibleTimeline.length, 0);

  return (
    <div className="animal-operational-history">
      {!isOperationallyActive ? (
        <section className="animal-status-banner animal-status-banner--inactive">
          <strong>Animal fora de operação</strong>
          <span>Operações bloqueadas para o status {String(goat.status ?? "-")}.</span>
        </section>
      ) : null}

      {hasActiveWithdrawal ? (
        <section className="animal-status-banner animal-status-banner--inactive">
          <strong>Carência sanitária ativa</strong>
          <span>
            {withdrawalStatus?.hasActiveMilkWithdrawal && withdrawalStatus.milkWithdrawal
              ? `Leite bloqueado até ${formatDate(withdrawalStatus.milkWithdrawal.withdrawalEndDate)} por ${withdrawalStatus.milkWithdrawal.productName || withdrawalStatus.milkWithdrawal.title || "tratamento sanitário"}. `
              : ""}
            {withdrawalStatus?.hasActiveMeatWithdrawal && withdrawalStatus.meatWithdrawal
              ? `Carne em carência até ${formatDate(withdrawalStatus.meatWithdrawal.withdrawalEndDate)} por ${withdrawalStatus.meatWithdrawal.productName || withdrawalStatus.meatWithdrawal.title || "tratamento sanitário"}.`
              : ""}
          </span>
        </section>
      ) : null}

      <section className="animal-cycle-grid" aria-label="Resumo operacional do ciclo">
        <article className="animal-cycle-card"><span className="animal-cycle-card__label">Situação</span><strong>{String(goat.status ?? "-")}</strong><small>{activePregnancy ? `Gestação ativa desde ${formatDate(activePregnancy.confirmDate)}` : "Sem gestação ativa."}</small></article>
        <article className="animal-cycle-card"><span className="animal-cycle-card__label">Última cobertura</span><strong>{formatDate(lastCoverage)}</strong>{!lastCoverage ? <small>Nenhuma cobertura</small> : null}</article>
        <article className="animal-cycle-card"><span className="animal-cycle-card__label">Parto / desmame</span><strong>{lastBirth ? formatDate(lastBirth) : "-"}</strong>{lastWeaning ? <small>Desmame em {formatDate(lastWeaning)}</small> : null}</article>
        <article className="animal-cycle-card"><span className="animal-cycle-card__label">Saída do rebanho</span><strong>{goat.exitDate ? formatDate(goat.exitDate) : "Em operação"}</strong>{goat.exitDate ? <small>{`${exitTypeLabels[(goat.exitType as GoatExitType) ?? "VENDA"] ?? goat.exitType ?? "Saída registrada"}${goat.exitNotes ? ` - ${goat.exitNotes}` : ""}`}</small> : null}</article>
      </section>

      <section className="animal-history-panel">
        <div className="animal-history-panel__header"><h3>Atividade recente</h3><span className="animal-history-panel__meta">{showCompleteHistory ? timeline.length : visibleTimeline.length} de {timeline.length}</span></div>
        {loading ? <div className="animal-history-panel__empty">Carregando histórico...</div> : timeline.length > 0 ? (
          <ol className="animal-history-timeline">
            {visibleTimeline.map((item) => (
              <li key={item.key} className={`animal-history-timeline__item animal-history-timeline__item--${item.tone}`}>
                <div className="animal-history-timeline__date">{formatDate(item.date)}</div>
                <div className="animal-history-timeline__content"><strong>{item.title}</strong><p>{item.detail}</p></div>
              </li>
            ))}
          </ol>
        ) : <div className="animal-history-panel__empty">Nenhum marco operacional registrado.</div>}
        {timeline.length > INITIAL_TIMELINE_ITEMS ? (
          <button
            type="button"
            className="animal-history-panel__toggle"
            aria-expanded={showCompleteHistory}
            onClick={() => setShowCompleteHistory((current) => !current)}
          >
            {showCompleteHistory
              ? "Mostrar somente os recentes"
              : `Ver histórico completo (${hiddenTimelineItems} a mais)`}
          </button>
        ) : null}
        {warning ? <p className="animal-history-panel__warning">{warning}</p> : null}
      </section>

      <section className="animal-history-panel">
        <div className="animal-history-panel__header">
          <div>
            <h3>Carência sanitária</h3>
          </div>
          <span className="animal-history-panel__meta">
            {hasActiveWithdrawal ? "Ativa" : "Sem carência ativa"}
          </span>
        </div>
        {withdrawalStatus?.hasActiveMilkWithdrawal && withdrawalStatus.milkWithdrawal ? (
          <div className="animal-history-panel__empty">
            Carência de leite até {formatDate(withdrawalStatus.milkWithdrawal.withdrawalEndDate)} por {withdrawalStatus.milkWithdrawal.productName || withdrawalStatus.milkWithdrawal.title || "tratamento sanitário"}.
          </div>
        ) : null}
        {withdrawalStatus?.hasActiveMeatWithdrawal && withdrawalStatus.meatWithdrawal ? (
          <div className="animal-history-panel__empty">
            Carência de carne até {formatDate(withdrawalStatus.meatWithdrawal.withdrawalEndDate)} por {withdrawalStatus.meatWithdrawal.productName || withdrawalStatus.meatWithdrawal.title || "tratamento sanitário"}.
          </div>
        ) : null}
        {!hasActiveWithdrawal ? (
          <div className="animal-history-panel__empty">
            Nenhuma carência sanitária ativa.
          </div>
        ) : null}
      </section>

      <section className="animal-history-panel">
        <div className="animal-history-panel__header"><h3>Crias vinculadas</h3>{offspring.length > 0 ? <span className="animal-history-panel__meta">{offspring.length} cria(s)</span> : null}</div>
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
        ) : <div className="animal-history-panel__empty">Nenhuma cria vinculada.</div>}
      </section>
    </div>
  );
}

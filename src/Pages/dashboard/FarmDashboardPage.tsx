import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { listInventoryBalances, listInventoryItems, listInventoryMovements } from "../../api/GoatFarmAPI/inventory";
import { getFarmDryOffAlerts } from "../../api/GoatFarmAPI/lactation";
import { getFarmPregnancyDiagnosisAlerts } from "../../api/GoatFarmAPI/reproduction";
import { fetchGoatHerdSummary } from "../../api/GoatAPI/goat";
import ContextBreadcrumb from "../../Components/pages-headers/ContextBreadcrumb";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import { Alert, EmptyState, ErrorState, LoadingState } from "../../Components/ui";
import type { HealthAlertsDTO } from "../../Models/HealthAlertsDTO";
import type { HealthEventResponseDTO } from "../../Models/HealthDTOs";
import type { InventoryBalancesPage, InventoryItemsPage, InventoryMovementHistoryPage } from "../../Models/InventoryDTOs";
import type { LactationDryOffAlertResponseDTO } from "../../Models/LactationDTOs";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatHerdSummaryDTO } from "../../Models/GoatHerdSummaryDTO";
import type { PregnancyDiagnosisAlertResponseDTO } from "../../Models/ReproductionDTOs";
import {
  buildFarmAlertsPath,
  buildFarmGoatsPath,
  buildFarmHealthAgendaPath,
  buildFarmInventoryPath,
} from "../../utils/appRoutes";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import "./FarmDashboardPage.css";

type FarmDashboardSectionKey = "herd" | "alerts" | "agenda" | "inventory";
type FarmDashboardSectionErrors = Partial<Record<FarmDashboardSectionKey, string>>;

type FarmDashboardMetric = {
  label: string;
  value: string;
  helper: string;
  icon: string;
};

type FarmActionCard = {
  title: string;
  description: string;
  icon: string;
  to: string;
  tone: "primary" | "secondary";
};

type FarmAgendaEntry = {
  title: string;
  goatId: string;
  scheduledDate: string;
  badge: string;
  tone: "today" | "overdue" | "upcoming";
};

export interface FarmDashboardData {
  farmData: GoatFarmDTO;
  herdSummary: GoatHerdSummaryDTO | null;
  reproductionAlerts: PregnancyDiagnosisAlertResponseDTO | null;
  lactationAlerts: LactationDryOffAlertResponseDTO | null;
  healthAlerts: HealthAlertsDTO | null;
  inventoryItems: InventoryItemsPage | null;
  inventoryBalances: InventoryBalancesPage | null;
  inventoryMovements: InventoryMovementHistoryPage | null;
}

export interface FarmDashboardPageViewProps {
  farmIdNumber: number;
  data: FarmDashboardData | null;
  loading: boolean;
  error: string | null;
  sectionErrors: FarmDashboardSectionErrors;
  onRetry: () => void;
}

const INVENTORY_MOVEMENT_LABELS: Record<string, string> = {
  IN: "Entrada",
  OUT: "Saída",
  ADJUST: "Ajuste",
};

const resolveErrorMessage = (error: unknown): string =>
  getApiErrorMessage(parseApiError(error));

const formatCount = (value?: number | null): string =>
  typeof value === "number" ? new Intl.NumberFormat("pt-BR").format(value) : "--";

const formatLocalDate = (value?: string | null): string => {
  if (!value) {
    return "Data não informada";
  }

  const datePart = value.includes("T") ? value.slice(0, 10) : value;
  const parts = datePart.split("-");

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return value;
};

const buildAgendaEntries = (healthAlerts: HealthAlertsDTO | null): FarmAgendaEntry[] => {
  if (!healthAlerts) {
    return [];
  }

  const mapEvent = (
    event: HealthEventResponseDTO,
    badge: string,
    tone: FarmAgendaEntry["tone"]
  ): FarmAgendaEntry => ({
    title: event.title || "Evento sanitário",
    goatId: event.goatId,
    scheduledDate: event.scheduledDate,
    badge,
    tone,
  });

  return [
    ...healthAlerts.dueTodayTop.map((event) => mapEvent(event, "Hoje", "today")),
    ...healthAlerts.overdueTop.map((event) => mapEvent(event, "Atrasado", "overdue")),
    ...healthAlerts.upcomingTop.map((event) => mapEvent(event, "Próximo", "upcoming")),
  ].slice(0, 4);
};

const buildAttentionItems = (data: FarmDashboardData | null): string[] => {
  if (!data) {
    return [];
  }

  const items: string[] = [];
  const reproductionPending = data.reproductionAlerts?.totalPending ?? 0;
  const lactationPending = data.lactationAlerts?.totalPending ?? 0;
  const dueToday = data.healthAlerts?.dueTodayCount ?? 0;
  const overdue = data.healthAlerts?.overdueCount ?? 0;
  const upcoming = data.healthAlerts?.upcomingCount ?? 0;

  if (reproductionPending > 0) {
    items.push(
      `${formatCount(reproductionPending)} diagnóstico${reproductionPending === 1 ? "" : "s"} de prenhez pendente${reproductionPending === 1 ? "" : "s"}.`
    );
  }

  if (lactationPending > 0) {
    items.push(
      `${formatCount(lactationPending)} secagem${lactationPending === 1 ? "" : "s"} recomendada${lactationPending === 1 ? "" : "s"}.`
    );
  }

  if (dueToday > 0) {
    items.push(
      `${formatCount(dueToday)} evento${dueToday === 1 ? "" : "s"} sanitário${dueToday === 1 ? "" : "s"} para hoje.`
    );
  }

  if (overdue > 0) {
    items.push(
      `${formatCount(overdue)} evento${overdue === 1 ? "" : "s"} sanitário${overdue === 1 ? "" : "s"} atrasado${overdue === 1 ? "" : "s"}.`
    );
  }

  if (items.length === 0 && upcoming > 0) {
    items.push(
      `${formatCount(upcoming)} evento${upcoming === 1 ? "" : "s"} sanitário${upcoming === 1 ? "" : "s"} chegando nos próximos 7 dias.`
    );
  }

  return items;
};

export function FarmDashboardPageView({
  farmIdNumber,
  data,
  loading,
  error,
  sectionErrors,
  onRetry,
}: FarmDashboardPageViewProps) {
  const safeFarmId = Number.isFinite(farmIdNumber) && farmIdNumber > 0 ? farmIdNumber : 0;
  const farmName = data?.farmData.name || "Fazenda";
  const farmLocation = [data?.farmData.city, data?.farmData.state].filter(Boolean).join(" • ");
  const herdSummary = data?.herdSummary ?? null;
  const reproductionPending = data?.reproductionAlerts?.totalPending ?? 0;
  const lactationPending = data?.lactationAlerts?.totalPending ?? 0;
  const healthDueToday = data?.healthAlerts?.dueTodayCount ?? 0;
  const healthOverdue = data?.healthAlerts?.overdueCount ?? 0;
  const healthUpcoming = data?.healthAlerts?.upcomingCount ?? 0;
  const reproductionHigh =
    data?.reproductionAlerts?.alerts?.filter((item) => item.daysOverdue > 0).length ?? 0;
  const reproductionMedium = Math.max(reproductionPending - reproductionHigh, 0);
  const lactationHigh =
    data?.lactationAlerts?.alerts?.filter((item) => item.daysOverdue > 0).length ?? 0;
  const lactationMedium = Math.max(lactationPending - lactationHigh, 0);
  const highSeverityCount = reproductionHigh + lactationHigh + healthOverdue;
  const mediumSeverityCount = reproductionMedium + lactationMedium + healthDueToday;
  const lowSeverityCount = healthUpcoming;
  const totalAttention = reproductionPending + lactationPending + healthDueToday + healthOverdue;
  const agendaEntries = useMemo(() => buildAgendaEntries(data?.healthAlerts ?? null), [data?.healthAlerts]);
  const attentionItems = useMemo(() => buildAttentionItems(data), [data]);
  const breeds = herdSummary?.breeds?.slice(0, 3) ?? [];
  const inventoryItemsCount =
    data?.inventoryItems?.page?.totalElements ?? data?.inventoryItems?.content?.length;
  const inventoryBalancesCount =
    data?.inventoryBalances?.page?.totalElements ?? data?.inventoryBalances?.content?.length;
  const inventoryMovementsCount =
    data?.inventoryMovements?.page?.totalElements ?? data?.inventoryMovements?.content?.length;
  const latestMovement = data?.inventoryMovements?.content?.[0] ?? null;

  const metrics: FarmDashboardMetric[] = [
    {
      label: "Animais",
      value: formatCount(herdSummary?.total),
      helper: "Total cadastrado no rebanho",
      icon: "fa-solid fa-goat",
    },
    {
      label: "Ativos",
      value: formatCount(herdSummary?.active),
      helper: "Animais ativos na fazenda",
      icon: "fa-solid fa-shield-heart",
    },
    {
      label: "Fêmeas / Machos",
      value:
        herdSummary != null
          ? `${formatCount(herdSummary.females)} / ${formatCount(herdSummary.males)}`
          : "--",
      helper: "Distribuição básica do plantel",
      icon: "fa-solid fa-venus-mars",
    },
    {
      label: "Atenção hoje",
      value: formatCount(totalAttention),
      helper:
        totalAttention > 0
          ? "Pendências que merecem ação agora"
          : "Sem pendências críticas no momento",
      icon: "fa-solid fa-bell",
    },
  ];

  const actionCards: FarmActionCard[] = [
    {
      title: "Alertas",
      description: "Veja reprodução, lactação e sanidade com foco no que está pendente agora.",
      icon: "fa-solid fa-bell",
      to: buildFarmAlertsPath(safeFarmId),
      tone: "primary",
    },
    {
      title: "Agenda sanitária",
      description: "Abra a agenda da fazenda e acompanhe o recorte operacional já disponível hoje.",
      icon: "fa-solid fa-calendar-days",
      to: buildFarmHealthAgendaPath(safeFarmId),
      tone: "secondary",
    },
    {
      title: "Estoque",
      description: "Consulte itens, saldos e movimentações recentes sem sair do contexto da fazenda.",
      icon: "fa-solid fa-boxes-stacked",
      to: buildFarmInventoryPath(safeFarmId),
      tone: "secondary",
    },
    {
      title: "Rebanho",
      description: "Acesse a lista de animais da fazenda e siga para os módulos por cabra quando precisar.",
      icon: "fa-solid fa-tractor",
      to: buildFarmGoatsPath(safeFarmId),
      tone: "secondary",
    },
  ];

  const content = loading ? (
    <LoadingState label="Carregando dashboard da fazenda..." />
  ) : error ? (
    <ErrorState
      title="Não foi possível carregar a dashboard da fazenda"
      description={error}
      onRetry={onRetry}
    />
  ) : (
    <>
      <ContextBreadcrumb
        items={[
          { label: "Fazendas", to: "/goatfarms" },
          { label: farmName, to: buildFarmGoatsPath(safeFarmId) },
          { label: "Dashboard da Fazenda" },
        ]}
      />

      <section className="farm-dashboard-hero" aria-label="Resumo da fazenda">
        <div>
          <span className="farm-dashboard-hero__eyebrow">Gestão da propriedade</span>
          <h1 className="farm-dashboard-hero__title">{farmName}</h1>
          <p className="farm-dashboard-hero__description">
            {farmLocation ? `${farmLocation} • ` : ""}
            Use esta visão para acompanhar rebanho, alertas, agenda sanitária e estoque
            sem misturar o contexto da fazenda com o manejo individual de cada animal.
          </p>

          <div className="farm-dashboard-hero__highlights">
            <span className="farm-dashboard-hero__highlight">
              <strong>{formatCount(reproductionPending + lactationPending)}</strong>
              alertas reprodutivos e de lactação
            </span>
            <span className="farm-dashboard-hero__highlight">
              <strong>{formatCount(healthDueToday + healthOverdue)}</strong>
              pontos sanitários em atenção
            </span>
            <span className="farm-dashboard-hero__highlight">
              <strong>{formatCount(inventoryItemsCount)}</strong>
              itens cadastrados no estoque
            </span>
          </div>
        </div>

        <Link to={buildFarmAlertsPath(safeFarmId)} className="farm-dashboard-hero__cta">
          Ver alertas da fazenda
        </Link>
      </section>

      <section className="farm-dashboard-metrics" aria-label="KPIs da fazenda">
        {metrics.map((metric) => (
          <article key={metric.label} className="farm-dashboard-metric-card">
            <span className="farm-dashboard-metric-card__icon" aria-hidden="true">
              <i className={metric.icon}></i>
            </span>
            <span className="farm-dashboard-metric-card__label">{metric.label}</span>
            <strong className="farm-dashboard-metric-card__value">{metric.value}</strong>
            <p className="farm-dashboard-metric-card__helper">{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className="farm-dashboard-section-grid" aria-label="Resumo gerencial da fazenda">
        <article className="farm-dashboard-panel">
          <div className="farm-dashboard-panel__header">
            <div>
              <span className="farm-dashboard-panel__eyebrow">Rebanho</span>
              <h2 className="farm-dashboard-panel__title">Indicadores do rebanho</h2>
            </div>
          </div>

          {sectionErrors.herd ? (
            <Alert variant="warning" title="Resumo parcial do rebanho">
              {sectionErrors.herd}
            </Alert>
          ) : null}

          {herdSummary ? (
            <>
              <div className="farm-dashboard-stat-list">
                <div className="farm-dashboard-stat">
                  <span className="farm-dashboard-stat__label">Ativos</span>
                  <strong className="farm-dashboard-stat__value">{formatCount(herdSummary.active)}</strong>
                </div>
                <div className="farm-dashboard-stat">
                  <span className="farm-dashboard-stat__label">Inativos</span>
                  <strong className="farm-dashboard-stat__value">{formatCount(herdSummary.inactive)}</strong>
                </div>
                <div className="farm-dashboard-stat">
                  <span className="farm-dashboard-stat__label">Vendidos</span>
                  <strong className="farm-dashboard-stat__value">{formatCount(herdSummary.sold)}</strong>
                </div>
                <div className="farm-dashboard-stat">
                  <span className="farm-dashboard-stat__label">Falecidos</span>
                  <strong className="farm-dashboard-stat__value">{formatCount(herdSummary.deceased)}</strong>
                </div>
              </div>

              <div className="farm-dashboard-panel__body-copy">
                <span className="farm-dashboard-panel__mini-label">Raças mais frequentes</span>
                {breeds.length > 0 ? (
                  <div className="farm-dashboard-tag-list">
                    {breeds.map((breed) => (
                      <span key={`${breed.breed}-${breed.count}`} className="farm-dashboard-tag">
                        {breed.breed}: {formatCount(breed.count)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="farm-dashboard-panel__hint">Sem distribuição por raça disponível.</p>
                )}
              </div>

              <Link to={buildFarmGoatsPath(safeFarmId)} className="farm-dashboard-panel__link">
                Abrir rebanho
              </Link>
            </>
          ) : (
            <EmptyState
              title="Resumo do rebanho indisponível"
              description="Não foi possível montar os indicadores agregados do rebanho agora."
              actionLabel="Tentar novamente"
              onAction={onRetry}
            />
          )}
        </article>

        <article className="farm-dashboard-panel">
          <div className="farm-dashboard-panel__header">
            <div>
              <span className="farm-dashboard-panel__eyebrow">Alertas</span>
              <h2 className="farm-dashboard-panel__title">Alertas resumidos</h2>
            </div>
          </div>

          {sectionErrors.alerts ? (
            <Alert variant="warning" title="Resumo parcial de alertas">
              {sectionErrors.alerts}
            </Alert>
          ) : null}

          <div className="farm-dashboard-alert-grid">
            <article className="farm-dashboard-alert-card farm-dashboard-alert-card--warning">
              <span className="farm-dashboard-alert-card__label">Reprodução</span>
              <strong className="farm-dashboard-alert-card__value">{formatCount(reproductionPending)}</strong>
              <p className="farm-dashboard-alert-card__description">Diagnósticos de prenhez pendentes.</p>
            </article>
            <article className="farm-dashboard-alert-card farm-dashboard-alert-card--info">
              <span className="farm-dashboard-alert-card__label">Lactação</span>
              <strong className="farm-dashboard-alert-card__value">{formatCount(lactationPending)}</strong>
              <p className="farm-dashboard-alert-card__description">Secagens recomendadas pendentes.</p>
            </article>
            <article className="farm-dashboard-alert-card farm-dashboard-alert-card--neutral">
              <span className="farm-dashboard-alert-card__label">Sanidade</span>
              <strong className="farm-dashboard-alert-card__value">{formatCount(healthDueToday + healthOverdue)}</strong>
              <p className="farm-dashboard-alert-card__description">
                {formatCount(healthUpcoming)} próximos nos próximos 7 dias.
              </p>
            </article>
          </div>

          <div className="farm-dashboard-severity-grid" aria-label="Resumo por severidade">
            <article className="farm-dashboard-severity-card farm-dashboard-severity-card--high">
              <span>Alta</span>
              <strong>{formatCount(highSeverityCount)}</strong>
            </article>
            <article className="farm-dashboard-severity-card farm-dashboard-severity-card--medium">
              <span>Média</span>
              <strong>{formatCount(mediumSeverityCount)}</strong>
            </article>
            <article className="farm-dashboard-severity-card farm-dashboard-severity-card--low">
              <span>Baixa</span>
              <strong>{formatCount(lowSeverityCount)}</strong>
            </article>
          </div>

          <p className="farm-dashboard-panel__hint">
            O detalhamento completo continua centralizado na página consolidada de alertas.
          </p>

          <Link to={buildFarmAlertsPath(safeFarmId)} className="farm-dashboard-panel__link">
            Ver alertas
          </Link>
        </article>

        <article className="farm-dashboard-panel">
          <div className="farm-dashboard-panel__header">
            <div>
              <span className="farm-dashboard-panel__eyebrow">Agenda</span>
              <h2 className="farm-dashboard-panel__title">Agenda sanitária da fazenda</h2>
            </div>
          </div>

          <p className="farm-dashboard-panel__hint">
            Recorte disponível hoje: sanidade. A agenda ainda não é unificada entre módulos.
          </p>

          {sectionErrors.agenda ? (
            <Alert variant="warning" title="Agenda parcial indisponível">
              {sectionErrors.agenda}
            </Alert>
          ) : null}

          {agendaEntries.length > 0 ? (
            <ul className="farm-dashboard-agenda-list">
              {agendaEntries.map((entry) => (
                <li key={`${entry.goatId}-${entry.title}-${entry.scheduledDate}`} className={`farm-dashboard-agenda-item farm-dashboard-agenda-item--${entry.tone}`}>
                  <div>
                    <span className="farm-dashboard-agenda-item__badge">{entry.badge}</span>
                    <h3 className="farm-dashboard-agenda-item__title">{entry.title}</h3>
                    <p className="farm-dashboard-agenda-item__meta">
                      Cabra {entry.goatId} • {formatLocalDate(entry.scheduledDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Sem agenda sanitária imediata"
              description="Não há itens sanitários em destaque para hoje e próximos dias."
            />
          )}

          <Link to={buildFarmHealthAgendaPath(safeFarmId)} className="farm-dashboard-panel__link">
            Abrir agenda
          </Link>
        </article>

        <article className="farm-dashboard-panel">
          <div className="farm-dashboard-panel__header">
            <div>
              <span className="farm-dashboard-panel__eyebrow">Estoque</span>
              <h2 className="farm-dashboard-panel__title">Estoque em resumo</h2>
            </div>
          </div>

          {sectionErrors.inventory ? (
            <Alert variant="warning" title="Resumo parcial de estoque">
              {sectionErrors.inventory}
            </Alert>
          ) : null}

          <div className="farm-dashboard-stat-list">
            <div className="farm-dashboard-stat">
              <span className="farm-dashboard-stat__label">Itens</span>
              <strong className="farm-dashboard-stat__value">{formatCount(inventoryItemsCount)}</strong>
            </div>
            <div className="farm-dashboard-stat">
              <span className="farm-dashboard-stat__label">Saldos ativos</span>
              <strong className="farm-dashboard-stat__value">{formatCount(inventoryBalancesCount)}</strong>
            </div>
            <div className="farm-dashboard-stat">
              <span className="farm-dashboard-stat__label">Movimentos</span>
              <strong className="farm-dashboard-stat__value">{formatCount(inventoryMovementsCount)}</strong>
            </div>
          </div>

          <div className="farm-dashboard-panel__body-copy">
            <span className="farm-dashboard-panel__mini-label">Último movimento</span>
            {latestMovement ? (
              <p className="farm-dashboard-panel__description">
                {INVENTORY_MOVEMENT_LABELS[latestMovement.type] || latestMovement.type} • {latestMovement.itemName} • {formatLocalDate(latestMovement.movementDate)}
              </p>
            ) : (
              <p className="farm-dashboard-panel__description">
                Nenhuma movimentação recente disponível para resumo.
              </p>
            )}
          </div>

          <Link to={buildFarmInventoryPath(safeFarmId)} className="farm-dashboard-panel__link">
            Abrir estoque
          </Link>
        </article>
      </section>

      <section className="farm-dashboard-attention" aria-label="Atenção hoje">
        <div className="farm-dashboard-attention__header">
          <div>
            <span className="farm-dashboard-panel__eyebrow">Foco do dia</span>
            <h2 className="farm-dashboard-panel__title">O que precisa da sua atenção hoje</h2>
          </div>
        </div>

        {attentionItems.length > 0 ? (
          <ul className="farm-dashboard-attention__list">
            {attentionItems.map((item) => (
              <li key={item} className="farm-dashboard-attention__item">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Sem alertas críticos agora"
            description="A fazenda está sem pendências críticas nesta visão resumida."
          />
        )}
      </section>

      <section className="farm-dashboard-actions" aria-label="Ações da fazenda">
        {actionCards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className={`farm-dashboard-action-card farm-dashboard-action-card--${card.tone}`}
          >
            <span className="farm-dashboard-action-card__icon" aria-hidden="true">
              <i className={card.icon}></i>
            </span>
            <div className="farm-dashboard-action-card__content">
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
            <span className="farm-dashboard-action-card__arrow" aria-hidden="true">
              <i className="fa-solid fa-arrow-right"></i>
            </span>
          </Link>
        ))}
      </section>
    </>
  );

  return (
    <div className="farm-dashboard-page">
      <GoatFarmHeader name={farmName} logoUrl={data?.farmData.logoUrl} farmId={safeFarmId} />

      <div className="farm-dashboard-page__content">{content}</div>
    </div>
  );
}

export default function FarmDashboardPage() {
  const { farmId } = useParams();
  const farmIdNumber = Number(farmId);
  const [data, setData] = useState<FarmDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionErrors, setSectionErrors] = useState<FarmDashboardSectionErrors>({});

  const loadDashboard = useCallback(async () => {
    if (!Number.isFinite(farmIdNumber) || farmIdNumber <= 0) {
      setLoading(false);
      setError("Identificador da fazenda inválido.");
      setData(null);
      setSectionErrors({});
      return;
    }

    setLoading(true);
    setError(null);

    const results = await Promise.allSettled([
      getGoatFarmById(farmIdNumber),
      fetchGoatHerdSummary(farmIdNumber),
      getFarmPregnancyDiagnosisAlerts(farmIdNumber, { page: 0, size: 5 }),
      getFarmDryOffAlerts(farmIdNumber, { page: 0, size: 5 }),
      healthAPI.getAlerts(farmIdNumber, 7),
      listInventoryItems(farmIdNumber, 0, 1, true),
      listInventoryBalances(farmIdNumber, { page: 0, size: 5, activeOnly: true }),
      listInventoryMovements(farmIdNumber, { page: 0, size: 1, sort: "movementDate,desc" }),
    ]);

    const [
      farmResult,
      herdResult,
      reproductionResult,
      lactationResult,
      healthResult,
      inventoryItemsResult,
      inventoryBalancesResult,
      inventoryMovementsResult,
    ] = results;

    if (farmResult.status !== "fulfilled") {
      setData(null);
      setSectionErrors({});
      setError(resolveErrorMessage(farmResult.reason));
      setLoading(false);
      return;
    }

    const nextSectionErrors: FarmDashboardSectionErrors = {};

    if (herdResult.status !== "fulfilled") {
      nextSectionErrors.herd = resolveErrorMessage(herdResult.reason);
    }

    if (
      reproductionResult.status !== "fulfilled" ||
      lactationResult.status !== "fulfilled" ||
      healthResult.status !== "fulfilled"
    ) {
      nextSectionErrors.alerts = "Parte do resumo de alertas não pôde ser carregada agora.";
    }

    if (healthResult.status !== "fulfilled") {
      nextSectionErrors.agenda = resolveErrorMessage(healthResult.reason);
    }

    if (
      inventoryItemsResult.status !== "fulfilled" ||
      inventoryBalancesResult.status !== "fulfilled" ||
      inventoryMovementsResult.status !== "fulfilled"
    ) {
      nextSectionErrors.inventory = "Parte do resumo de estoque não pôde ser carregada agora.";
    }

    setData({
      farmData: farmResult.value,
      herdSummary: herdResult.status === "fulfilled" ? herdResult.value : null,
      reproductionAlerts:
        reproductionResult.status === "fulfilled" ? reproductionResult.value : null,
      lactationAlerts: lactationResult.status === "fulfilled" ? lactationResult.value : null,
      healthAlerts: healthResult.status === "fulfilled" ? healthResult.value : null,
      inventoryItems:
        inventoryItemsResult.status === "fulfilled" ? inventoryItemsResult.value : null,
      inventoryBalances:
        inventoryBalancesResult.status === "fulfilled"
          ? inventoryBalancesResult.value
          : null,
      inventoryMovements:
        inventoryMovementsResult.status === "fulfilled"
          ? inventoryMovementsResult.value
          : null,
    });
    setSectionErrors(nextSectionErrors);
    setLoading(false);
  }, [farmIdNumber]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <FarmDashboardPageView
      farmIdNumber={farmIdNumber}
      data={data}
      loading={loading}
      error={error}
      sectionErrors={sectionErrors}
      onRetry={loadDashboard}
    />
  );
}


import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { fetchGoatHerdSummary, findGoatsByFarmIdPaginated } from "../../api/GoatAPI/goat";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { listInventoryBalances, listInventoryItems, listInventoryMovements } from "../../api/GoatFarmAPI/inventory";
import { getFarmDryOffAlerts, getLactationHistory } from "../../api/GoatFarmAPI/lactation";
import { listMilkProductions } from "../../api/GoatFarmAPI/milkProduction";
import {
  getFarmPregnancyDiagnosisAlerts,
  listPregnancies,
  listReproductiveEvents
} from "../../api/GoatFarmAPI/reproduction";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import { HealthEventResponseDTO } from "../../Models/HealthDTOs";
import { HealthAlertsDTO } from "../../Models/HealthAlertsDTO";
import type { InventoryBalance, InventoryItem, InventoryMovementHistoryEntry } from "../../Models/InventoryDTOs";
import type { LactationResponseDTO, LactationDryOffAlertResponseDTO } from "../../Models/LactationDTOs";
import type { MilkProductionResponseDTO } from "../../Models/MilkProductionDTOs";
import type { GoatHerdSummaryDTO } from "../../Models/GoatHerdSummaryDTO";
import type { PregnancyDiagnosisAlertResponseDTO, PregnancyResponseDTO, ReproductiveEventResponseDTO } from "../../Models/ReproductionDTOs";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import {
  buildHealthRows,
  buildInventoryRows,
  buildLactationRows,
  buildOverviewRows,
  buildReproductionRows,
  downloadCsv,
  getReportFilename,
  type FarmReportTab
} from "./farmReports";
import "./reportsPage.css";

const TABS: Array<{ id: FarmReportTab; label: string; description: string }> = [
  { id: "overview", label: "Visão geral", description: "Resumo executivo da fazenda" },
  { id: "health", label: "Sanidade", description: "Agenda e eventos por fazenda" },
  { id: "inventory", label: "Estoque", description: "Itens, saldos e movimentações" },
  { id: "reproduction", label: "Reprodução", description: "Relatório operacional por cabra" },
  { id: "lactation", label: "Leite e lactação", description: "Histórico de lactação e produções por cabra" }
];

function isValidTab(value: string | null): value is FarmReportTab {
  return TABS.some((tab) => tab.id === value);
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(parsed);
}

export default function FarmReportsPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const farmIdNumber = useMemo(() => (farmId ? Number(farmId) : NaN), [farmId]);
  const activeTab = useMemo<FarmReportTab>(() => {
    const tab = searchParams.get("tab");
    return isValidTab(tab) ? tab : "overview";
  }, [searchParams]);
  const selectedGoatId = searchParams.get("goatId") ?? "";

  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [goats, setGoats] = useState<GoatResponseDTO[]>([]);
  const [herdSummary, setHerdSummary] = useState<GoatHerdSummaryDTO | null>(null);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlertsDTO | null>(null);
  const [pregnancyAlerts, setPregnancyAlerts] = useState<PregnancyDiagnosisAlertResponseDTO | null>(null);
  const [dryOffAlerts, setDryOffAlerts] = useState<LactationDryOffAlertResponseDTO | null>(null);
  const [overviewBalances, setOverviewBalances] = useState<InventoryBalance[]>([]);
  const [overviewMovements, setOverviewMovements] = useState<InventoryMovementHistoryEntry[]>([]);

  const [healthEvents, setHealthEvents] = useState<HealthEventResponseDTO[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovementHistoryEntry[]>([]);
  const [reproductiveEvents, setReproductiveEvents] = useState<ReproductiveEventResponseDTO[]>([]);
  const [pregnancies, setPregnancies] = useState<PregnancyResponseDTO[]>([]);
  const [lactationHistory, setLactationHistory] = useState<LactationResponseDTO[]>([]);
  const [milkProductions, setMilkProductions] = useState<MilkProductionResponseDTO[]>([]);

  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingTab, setLoadingTab] = useState(false);
  const [pageError, setPageError] = useState("");
  const [tabError, setTabError] = useState("");
  const [dataWarning, setDataWarning] = useState("");

  const selectedGoat = useMemo(
    () => goats.find((goat) => goat.registrationNumber === selectedGoatId) ?? null,
    [goats, selectedGoatId]
  );

  const updateSearchParams = useCallback((changes: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.entries(changes).forEach(([key, value]) => {
      if (!value) nextParams.delete(key);
      else nextParams.set(key, value);
    });

    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  const loadBaseData = useCallback(async () => {
    if (Number.isNaN(farmIdNumber)) return;

    setLoadingBase(true);
    setPageError("");
    setDataWarning("");

    const [farmResult, goatsResult, herdResult, healthResult, pregnancyResult, dryOffResult, balanceResult, movementResult] = await Promise.allSettled([
      getGoatFarmById(farmIdNumber),
      findGoatsByFarmIdPaginated(farmIdNumber, 0, 100),
      fetchGoatHerdSummary(farmIdNumber),
      healthAPI.getAlerts(farmIdNumber, 7),
      getFarmPregnancyDiagnosisAlerts(farmIdNumber, { page: 0, size: 10 }),
      getFarmDryOffAlerts(farmIdNumber, { page: 0, size: 10 }),
      listInventoryBalances(farmIdNumber, { page: 0, size: 10, activeOnly: true }),
      listInventoryMovements(farmIdNumber, { page: 0, size: 10, sort: "movementDate,desc" })
    ]);

    if (farmResult.status === "rejected") {
      setPageError("Não foi possível carregar os relatórios da fazenda.");
      setLoadingBase(false);
      return;
    }

    setFarmData(farmResult.value);

    const failedScopes: string[] = [];

    if (goatsResult.status === "fulfilled") {
      setGoats(goatsResult.value.content ?? []);
    } else {
      setGoats([]);
      failedScopes.push("rebanho");
    }

    if (herdResult.status === "fulfilled") {
      setHerdSummary(herdResult.value);
    } else {
      setHerdSummary(null);
      failedScopes.push("indicadores");
    }

    if (healthResult.status === "fulfilled") {
      setHealthAlerts(healthResult.value);
    } else {
      setHealthAlerts(null);
      failedScopes.push("sanidade");
    }

    if (pregnancyResult.status === "fulfilled") {
      setPregnancyAlerts(pregnancyResult.value);
    } else {
      setPregnancyAlerts(null);
      failedScopes.push("reprodução");
    }

    if (dryOffResult.status === "fulfilled") {
      setDryOffAlerts(dryOffResult.value);
    } else {
      setDryOffAlerts(null);
      failedScopes.push("lactação");
    }

    if (balanceResult.status === "fulfilled") {
      setOverviewBalances(balanceResult.value.content ?? []);
    } else {
      setOverviewBalances([]);
      failedScopes.push("estoque");
    }

    if (movementResult.status === "fulfilled") {
      setOverviewMovements(movementResult.value.content ?? []);
    } else {
      setOverviewMovements([]);
      failedScopes.push("movimentações");
    }

    if (failedScopes.length > 0) {
      setDataWarning(`Parte dos dados não pôde ser carregada agora (${failedScopes.join(", ")}).`);
    }

    setLoadingBase(false);
  }, [farmIdNumber]);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    if (!selectedGoatId && goats.length > 0) {
      updateSearchParams({ goatId: goats[0].registrationNumber });
    }
  }, [goats, selectedGoatId, updateSearchParams]);

  const loadTabData = useCallback(async () => {
    if (Number.isNaN(farmIdNumber)) return;

    setLoadingTab(true);
    setTabError("");

    try {
      if (activeTab === "health") {
        const today = new Date();
        const fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 15);
        const toDate = new Date(today);
        toDate.setDate(today.getDate() + 30);

        const response = await healthAPI.getCalendar(farmIdNumber, {
          page: 0,
          size: 50,
          from: fromDate.toISOString().split("T")[0],
          to: toDate.toISOString().split("T")[0],
          sort: "scheduledDate,asc"
        });
        setHealthEvents(response.content ?? []);
        return;
      }

      if (activeTab === "inventory") {
        const [itemsPage, balancesPage, movementsPage] = await Promise.all([
          listInventoryItems(farmIdNumber, 0, 50, true),
          listInventoryBalances(farmIdNumber, { page: 0, size: 50, activeOnly: true }),
          listInventoryMovements(farmIdNumber, { page: 0, size: 50, sort: "movementDate,desc" })
        ]);

        setInventoryItems(itemsPage.content ?? []);
        setInventoryBalances(balancesPage.content ?? []);
        setInventoryMovements(movementsPage.content ?? []);
        return;
      }

      if (activeTab === "reproduction") {
        if (!selectedGoatId) {
          setReproductiveEvents([]);
          setPregnancies([]);
          return;
        }

        const [eventsPage, pregnanciesPage] = await Promise.all([
          listReproductiveEvents(farmIdNumber, selectedGoatId, { page: 0, size: 50 }),
          listPregnancies(farmIdNumber, selectedGoatId, { page: 0, size: 50 })
        ]);

        setReproductiveEvents(eventsPage.content ?? []);
        setPregnancies(pregnanciesPage.content ?? []);
        return;
      }

      if (activeTab === "lactation") {
        if (!selectedGoatId) {
          setLactationHistory([]);
          setMilkProductions([]);
          return;
        }

        const [historyResponse, productionsResponse] = await Promise.all([
          getLactationHistory(farmIdNumber, selectedGoatId, 0, 20),
          listMilkProductions(farmIdNumber, selectedGoatId, { page: 0, size: 50 })
        ]);

        setLactationHistory(historyResponse.content ?? []);
        setMilkProductions(productionsResponse.content ?? []);
      }
    } catch (error) {
      console.error("Erro ao carregar relatório", error);
      setTabError("Não foi possível carregar o relatório desta aba.");
    } finally {
      setLoadingTab(false);
    }
  }, [activeTab, farmIdNumber, selectedGoatId]);

  useEffect(() => {
    if (activeTab === "overview") return;
    loadTabData();
  }, [activeTab, loadTabData]);

  const handleExportCsv = useCallback(() => {
    if (activeTab === "overview") {
      downloadCsv(
        getReportFilename("overview", farmData?.name),
        buildOverviewRows({
          herdSummary,
          healthAlerts,
          pregnancyAlerts,
          dryOffAlerts,
          inventoryBalances: overviewBalances
        })
      );
      return;
    }

    if (activeTab === "health") {
      downloadCsv(getReportFilename("health", farmData?.name), buildHealthRows(healthEvents));
      return;
    }

    if (activeTab === "inventory") {
      downloadCsv(
        getReportFilename("inventory", farmData?.name),
        buildInventoryRows({
          items: inventoryItems,
          balances: inventoryBalances,
          movements: inventoryMovements
        })
      );
      return;
    }

    if (activeTab === "reproduction") {
      downloadCsv(
        getReportFilename("reproduction", farmData?.name, selectedGoatId),
        buildReproductionRows({ events: reproductiveEvents, pregnancies })
      );
      return;
    }

    downloadCsv(
      getReportFilename("lactation", farmData?.name, selectedGoatId),
      buildLactationRows({ history: lactationHistory, productions: milkProductions })
    );
  }, [activeTab, dryOffAlerts, farmData?.name, healthAlerts, healthEvents, herdSummary, inventoryBalances, inventoryItems, inventoryMovements, lactationHistory, milkProductions, overviewBalances, pregnancies, pregnancyAlerts, reproductiveEvents, selectedGoatId]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (Number.isNaN(farmIdNumber)) {
    return (
      <div className="reports-shell reports-shell--centered">
        <div className="reports-feedback reports-feedback--error">
          <h1>Fazenda inválida</h1>
          <p>Não foi possível identificar a fazenda solicitada.</p>
          <button className="reports-btn reports-btn--secondary" type="button" onClick={() => navigate("/goatfarms")}>Voltar</button>
        </div>
      </div>
    );
  }

  const currentTab = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <div className="reports-shell">
      <GoatFarmHeader name={farmData?.name || "Capril"} logoUrl={farmData?.logoUrl} farmId={farmIdNumber} />

      <section className="reports-hero">
        <div>
          <p className="reports-hero__eyebrow">Relatórios e exportações</p>
          <h1>Relatórios da fazenda</h1>
          <p className="reports-hero__copy">
            Área única para visão geral, sanidade, estoque, reprodução e leite. Onde o backend atual ainda é por cabra, o recorte é explícito.
          </p>
        </div>
        <div className="reports-hero__actions">
          <button className="reports-btn reports-btn--secondary" type="button" onClick={handlePrint}>Versão para impressão</button>
          <button className="reports-btn reports-btn--primary" type="button" onClick={handleExportCsv}>Exportar CSV</button>
        </div>
      </section>

      {dataWarning ? <div className="reports-feedback reports-feedback--warning">{dataWarning}</div> : null}

      <section className="reports-toolbar">
        <div className="reports-tabs" role="tablist" aria-label="Módulos de relatório">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`reports-tab${activeTab === tab.id ? " reports-tab--active" : ""}`}
              onClick={() => updateSearchParams({ tab: tab.id })}
            >
              <span>{tab.label}</span>
              <small>{tab.description}</small>
            </button>
          ))}
        </div>

        {(activeTab === "reproduction" || activeTab === "lactation") ? (
          <label className="reports-select">
            <span>Cabra do relatório</span>
            <select value={selectedGoatId} onChange={(event) => updateSearchParams({ goatId: event.target.value || null })}>
              {goats.map((goat) => (
                <option key={goat.registrationNumber} value={goat.registrationNumber}>
                  {goat.registrationNumber} · {goat.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </section>

      {loadingBase ? (
        <div className="reports-feedback">Carregando base dos relatórios...</div>
      ) : pageError ? (
        <div className="reports-feedback reports-feedback--error">
          <h2>Não foi possível carregar a área de relatórios</h2>
          <p>{pageError}</p>
          <button className="reports-btn reports-btn--secondary" type="button" onClick={loadBaseData}>Tentar novamente</button>
        </div>
      ) : (
        <section className="reports-content">
          <header className="reports-section-header">
            <div>
              <h2>{currentTab.label}</h2>
              <p>{currentTab.description}</p>
            </div>
            {selectedGoat ? (
              <div className="reports-context-chip">Cabra selecionada: {selectedGoat.registrationNumber} · {selectedGoat.name}</div>
            ) : null}
          </header>

          {activeTab === "overview" ? (
            <div className="reports-grid">
              <article className="reports-card reports-card--metric"><span>Total do rebanho</span><strong>{herdSummary?.total ?? 0}</strong></article>
              <article className="reports-card reports-card--metric"><span>Alertas sanitários</span><strong>{(healthAlerts?.dueTodayCount ?? 0) + (healthAlerts?.upcomingCount ?? 0) + (healthAlerts?.overdueCount ?? 0)}</strong></article>
              <article className="reports-card reports-card--metric"><span>Diagnósticos pendentes</span><strong>{pregnancyAlerts?.totalPending ?? 0}</strong></article>
              <article className="reports-card reports-card--metric"><span>Secagens recomendadas</span><strong>{dryOffAlerts?.totalPending ?? 0}</strong></article>

              <article className="reports-card">
                <h3>Atenção reprodutiva</h3>
                <ul>
                  {(pregnancyAlerts?.alerts ?? []).slice(0, 5).map((alert) => (
                    <li key={`${alert.goatId}-${alert.eligibleDate}`}>{alert.goatId} · diagnóstico em {formatDate(alert.eligibleDate)}</li>
                  ))}
                  {(pregnancyAlerts?.alerts ?? []).length === 0 ? <li>Nenhum diagnóstico pendente.</li> : null}
                </ul>
              </article>

              <article className="reports-card">
                <h3>Atenção de lactação</h3>
                <ul>
                  {(dryOffAlerts?.alerts ?? []).slice(0, 5).map((alert) => (
                    <li key={`${alert.goatId}-${alert.dryOffDate}`}>{alert.goatId} · secagem em {formatDate(alert.dryOffDate)}</li>
                  ))}
                  {(dryOffAlerts?.alerts ?? []).length === 0 ? <li>Nenhuma secagem pendente.</li> : null}
                </ul>
              </article>

              <article className="reports-card">
                <h3>Últimas movimentações de estoque</h3>
                <ul>
                  {overviewMovements.slice(0, 5).map((movement) => (
                    <li key={movement.movementId}>{movement.itemName} · {movement.type} {movement.quantity} em {formatDate(movement.movementDate)}</li>
                  ))}
                  {overviewMovements.length === 0 ? <li>Nenhuma movimentação recente.</li> : null}
                </ul>
              </article>
            </div>
          ) : loadingTab ? (
            <div className="reports-feedback">Carregando dados desta aba...</div>
          ) : tabError ? (
            <div className="reports-feedback reports-feedback--error">
              <p>{tabError}</p>
              <button className="reports-btn reports-btn--secondary" type="button" onClick={loadTabData}>Tentar novamente</button>
            </div>
          ) : activeTab === "health" ? (
            healthEvents.length > 0 ? (
              <div className="reports-table-shell">
                <table className="reports-table">
                  <thead><tr><th>Data</th><th>Cabra</th><th>Título</th><th>Tipo</th><th>Status</th></tr></thead>
                  <tbody>
                    {healthEvents.map((event) => (
                      <tr key={event.id}>
                        <td>{formatDate(event.scheduledDate)}</td>
                        <td>{event.goatId}</td>
                        <td>{event.title}</td>
                        <td>{event.type}</td>
                        <td>{event.overdue ? "Em atraso" : event.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="reports-feedback">Nenhum evento sanitário encontrado para o período padrão.</div>
          ) : activeTab === "inventory" ? (
            <div className="reports-stack">
              <div className="reports-table-shell">
                <h3>Itens e saldos</h3>
                <table className="reports-table">
                  <thead><tr><th>Item</th><th>Lote</th><th>Saldo</th></tr></thead>
                  <tbody>
                    {inventoryBalances.map((balance) => (
                      <tr key={`${balance.itemId}-${balance.lotId ?? "none"}`}>
                        <td>{balance.itemName}</td>
                        <td>{balance.lotId ?? "-"}</td>
                        <td>{balance.quantity}</td>
                      </tr>
                    ))}
                    {inventoryBalances.length === 0 ? (
                      <tr><td colSpan={3}>Nenhum saldo encontrado.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="reports-table-shell">
                <h3>Movimentações recentes</h3>
                <table className="reports-table">
                  <thead><tr><th>Data</th><th>Item</th><th>Tipo</th><th>Quantidade</th><th>Saldo</th></tr></thead>
                  <tbody>
                    {inventoryMovements.map((movement) => (
                      <tr key={movement.movementId}>
                        <td>{formatDate(movement.movementDate)}</td>
                        <td>{movement.itemName}</td>
                        <td>{movement.type}</td>
                        <td>{movement.quantity}</td>
                        <td>{movement.resultingBalance}</td>
                      </tr>
                    ))}
                    {inventoryMovements.length === 0 ? (
                      <tr><td colSpan={5}>Nenhuma movimentação encontrada.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === "reproduction" ? (
            selectedGoat ? (
              <div className="reports-stack">
                <div className="reports-table-shell">
                  <h3>Eventos reprodutivos</h3>
                  <table className="reports-table">
                    <thead><tr><th>Data</th><th>Tipo</th><th>Detalhe</th><th>Observações</th></tr></thead>
                    <tbody>
                      {reproductiveEvents.map((event) => (
                        <tr key={event.id}>
                          <td>{formatDate(event.eventDate)}</td>
                          <td>{event.eventType}</td>
                          <td>{event.breedingType ?? event.checkResult ?? "-"}</td>
                          <td>{event.notes ?? "-"}</td>
                        </tr>
                      ))}
                      {reproductiveEvents.length === 0 ? <tr><td colSpan={4}>Nenhum evento reprodutivo encontrado.</td></tr> : null}
                    </tbody>
                  </table>
                </div>

                <div className="reports-table-shell">
                  <h3>Histórico de gestações</h3>
                  <table className="reports-table">
                    <thead><tr><th>Status</th><th>Cobertura</th><th>Confirmação</th><th>Encerramento</th></tr></thead>
                    <tbody>
                      {pregnancies.map((pregnancy) => (
                        <tr key={pregnancy.id}>
                          <td>{pregnancy.status}</td>
                          <td>{formatDate(pregnancy.breedingDate)}</td>
                          <td>{formatDate(pregnancy.confirmDate)}</td>
                          <td>{formatDate(pregnancy.closeDate)}</td>
                        </tr>
                      ))}
                      {pregnancies.length === 0 ? <tr><td colSpan={4}>Nenhuma gestação encontrada.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <div className="reports-feedback">Selecione uma cabra para gerar o relatório de reprodução.</div>
          ) : selectedGoat ? (
            <div className="reports-stack">
              <div className="reports-table-shell">
                <h3>Histórico de lactações</h3>
                <table className="reports-table">
                  <thead><tr><th>Início</th><th>Status</th><th>Encerramento</th><th>Gestação</th></tr></thead>
                  <tbody>
                    {lactationHistory.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.startDate)}</td>
                        <td>{entry.status}</td>
                        <td>{formatDate(entry.endDate)}</td>
                        <td>{formatDate(entry.pregnancyStartDate)}</td>
                      </tr>
                    ))}
                    {lactationHistory.length === 0 ? <tr><td colSpan={4}>Nenhuma lactação encontrada.</td></tr> : null}
                  </tbody>
                </table>
              </div>

              <div className="reports-table-shell">
                <h3>Produções de leite</h3>
                <table className="reports-table">
                  <thead><tr><th>Data</th><th>Turno</th><th>Volume</th><th>Status</th></tr></thead>
                  <tbody>
                    {milkProductions.map((production) => (
                      <tr key={production.id}>
                        <td>{formatDate(production.date)}</td>
                        <td>{production.shift}</td>
                        <td>{production.volumeLiters} L</td>
                        <td>{production.status}</td>
                      </tr>
                    ))}
                    {milkProductions.length === 0 ? <tr><td colSpan={4}>Nenhuma produção encontrada.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="reports-feedback">Selecione uma cabra para gerar o relatório de leite e lactação.</div>
          )}
        </section>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { Alert, Button, Card, EmptyState, LoadingState, Table } from "../../Components/ui";
import {
  getFarmMilkProductionAnnualSummary,
  getFarmMilkProductionDailySummary,
  getFarmMilkProductionMonthlySummary,
  upsertFarmMilkProductionDaily,
} from "../../api/GoatFarmAPI/farmMilkProduction";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import type {
  FarmMilkProductionAnnualSummaryDTO,
  FarmMilkProductionDailySummaryDTO,
  FarmMilkProductionMonthlySummaryDTO,
} from "../../Models/FarmMilkProductionDTOs";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import { buildFarmDashboardPath } from "../../utils/appRoutes";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import { getTodayLocalDate } from "../../utils/localDate";
import "./farmMilkProductionPage.css";

const formatVolume = (value?: number | null) => {
  if (value === null || value === undefined) return "0,00 L";
  return `${Number(value).toFixed(2).replace(".", ",")} L`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
};

const monthInputDefault = new Date().toISOString().slice(0, 7);

const emptyDaily: FarmMilkProductionDailySummaryDTO = {
  productionDate: getTodayLocalDate(),
  registered: false,
  totalProduced: 0,
  withdrawalProduced: 0,
  marketableProduced: 0,
  notes: "",
  updatedAt: null,
};

const emptyMonthly: FarmMilkProductionMonthlySummaryDTO = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  totalProduced: 0,
  withdrawalProduced: 0,
  marketableProduced: 0,
  daysRegistered: 0,
  dailyRecords: [],
};

const emptyAnnual: FarmMilkProductionAnnualSummaryDTO = {
  year: new Date().getFullYear(),
  totalProduced: 0,
  withdrawalProduced: 0,
  marketableProduced: 0,
  daysRegistered: 0,
  monthlyRecords: [],
};

export default function FarmMilkProductionPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);

  const [farm, setFarm] = useState<GoatFarmDTO | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate());
  const [selectedMonth, setSelectedMonth] = useState(monthInputDefault);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [dailySummary, setDailySummary] = useState<FarmMilkProductionDailySummaryDTO>(emptyDaily);
  const [monthlySummary, setMonthlySummary] = useState<FarmMilkProductionMonthlySummaryDTO>(emptyMonthly);
  const [annualSummary, setAnnualSummary] = useState<FarmMilkProductionAnnualSummaryDTO>(emptyAnnual);

  const [form, setForm] = useState({
    totalProduced: "",
    withdrawalProduced: "",
    notes: "",
  });

  const [loadingFarm, setLoadingFarm] = useState(true);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [loadingYear, setLoadingYear] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dailyError, setDailyError] = useState("");
  const [monthError, setMonthError] = useState("");
  const [yearError, setYearError] = useState("");

  const computedMarketable = useMemo(() => {
    const total = Number(form.totalProduced || 0);
    const withdrawal = Number(form.withdrawalProduced || 0);
    const raw = total - withdrawal;
    return raw >= 0 ? raw : 0;
  }, [form.totalProduced, form.withdrawalProduced]);

  useEffect(() => {
    if (!Number.isFinite(farmIdNumber) || farmIdNumber <= 0) return;
    let active = true;

    async function loadFarm() {
      try {
        setLoadingFarm(true);
        const result = await getGoatFarmById(farmIdNumber);
        if (!active) return;
        setFarm(result);
      } catch (error) {
        if (!active) return;
        toast.error(getApiErrorMessage(parseApiError(error)));
      } finally {
        if (active) setLoadingFarm(false);
      }
    }

    void loadFarm();
    return () => {
      active = false;
    };
  }, [farmIdNumber]);

  useEffect(() => {
    if (!Number.isFinite(farmIdNumber) || farmIdNumber <= 0) return;
    let active = true;

    async function loadDaily() {
      try {
        setLoadingDaily(true);
        setDailyError("");
        const result = await getFarmMilkProductionDailySummary(farmIdNumber, selectedDate);
        if (!active) return;
        setDailySummary(result);
        setForm({
          totalProduced: result.registered ? String(result.totalProduced) : "",
          withdrawalProduced: result.registered ? String(result.withdrawalProduced) : "",
          notes: result.notes || "",
        });
      } catch (error) {
        if (!active) return;
        setDailyError(getApiErrorMessage(parseApiError(error)));
      } finally {
        if (active) setLoadingDaily(false);
      }
    }

    void loadDaily();
    return () => {
      active = false;
    };
  }, [farmIdNumber, selectedDate]);

  useEffect(() => {
    if (!Number.isFinite(farmIdNumber) || farmIdNumber <= 0) return;
    let active = true;

    async function loadMonthly() {
      const [year, month] = selectedMonth.split("-").map(Number);
      try {
        setLoadingMonth(true);
        setMonthError("");
        const result = await getFarmMilkProductionMonthlySummary(farmIdNumber, year, month);
        if (!active) return;
        setMonthlySummary(result);
      } catch (error) {
        if (!active) return;
        setMonthError(getApiErrorMessage(parseApiError(error)));
      } finally {
        if (active) setLoadingMonth(false);
      }
    }

    void loadMonthly();
    return () => {
      active = false;
    };
  }, [farmIdNumber, selectedMonth]);

  useEffect(() => {
    if (!Number.isFinite(farmIdNumber) || farmIdNumber <= 0) return;
    let active = true;

    async function loadAnnual() {
      try {
        setLoadingYear(true);
        setYearError("");
        const result = await getFarmMilkProductionAnnualSummary(farmIdNumber, selectedYear);
        if (!active) return;
        setAnnualSummary(result);
      } catch (error) {
        if (!active) return;
        setYearError(getApiErrorMessage(parseApiError(error)));
      } finally {
        if (active) setLoadingYear(false);
      }
    }

    void loadAnnual();
    return () => {
      active = false;
    };
  }, [farmIdNumber, selectedYear]);

  async function handleSubmit() {
    if (!Number.isFinite(farmIdNumber) || farmIdNumber <= 0) return;

    const total = Number(form.totalProduced);
    const withdrawal = Number(form.withdrawalProduced || 0);

    if (Number.isNaN(total) || total < 0) {
      toast.error("Informe o total produzido do dia.");
      return;
    }
    if (Number.isNaN(withdrawal) || withdrawal < 0) {
      toast.error("Informe um volume restrito válido.");
      return;
    }
    if (withdrawal > total) {
      toast.error("O volume restrito não pode ser maior que o total produzido.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await upsertFarmMilkProductionDaily(farmIdNumber, selectedDate, {
        totalProduced: total,
        withdrawalProduced: withdrawal,
        notes: form.notes || undefined,
      });
      setDailySummary(result);
      toast.success("Produção consolidada salva.");

      const [year, month] = selectedMonth.split("-").map(Number);
      if (year === Number(selectedDate.slice(0, 4)) && month === Number(selectedDate.slice(5, 7))) {
        const refreshedMonth = await getFarmMilkProductionMonthlySummary(farmIdNumber, year, month);
        setMonthlySummary(refreshedMonth);
      }
      if (selectedYear === Number(selectedDate.slice(0, 4))) {
        const refreshedYear = await getFarmMilkProductionAnnualSummary(farmIdNumber, selectedYear);
        setAnnualSummary(refreshedYear);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(parseApiError(error)));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingFarm && !farm) {
    return <LoadingState label="Carregando produção consolidada da fazenda..." />;
  }

  return (
    <div className="farm-milk-page lactation-page">
      <section className="lactation-page__hero">
        <PageHeader
          title={"Produ\u00e7\u00e3o consolidada da fazenda"}
          subtitle={`${farm?.name || "Fazenda"} · Leitura operacional de leite por dia, mês e ano`}
          showBackButton
          backTo={buildFarmDashboardPath(farmIdNumber)}
          actions={
            <div className="lactation-page__actions">
              <Button variant="outline" onClick={() => navigate(buildFarmDashboardPath(farmIdNumber))}>
                <i className="fa-solid fa-chart-line" aria-hidden="true"></i> Dashboard da fazenda
              </Button>
            </div>
          }
        />
      </section>

      <Alert variant="info" title={"Sem\u00e2ntica do consolidado"}>
        {"A produ\u00e7\u00e3o individual por cabra continua existindo para an\u00e1lise zoot\u00e9cnica. Esta p\u00e1gina registra o consolidado operacional da fazenda, separado entre total registrado, volume restrito por car\u00eancia e volume liberado/comercializ\u00e1vel."}
      </Alert>

      <section className="farm-milk-grid">
        <Card
          className="farm-milk-card"
          title={"Lan\u00e7amento di\u00e1rio consolidado"}
          description={"Um registro operacional por fazenda e data, com atualiza\u00e7\u00e3o segura do mesmo dia."}
        >
          <div className="farm-milk-form">
            <label>
              <span>Data</span>
              <input type="date" value={selectedDate} max={getTodayLocalDate()} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>
            <label>
              <span>Total produzido (L)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.totalProduced}
                onChange={(event) => setForm((prev) => ({ ...prev, totalProduced: event.target.value }))}
              />
            </label>
            <label>
              <span>{"Restrito / em car\u00eancia (L)"}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.withdrawalProduced}
                onChange={(event) => setForm((prev) => ({ ...prev, withdrawalProduced: event.target.value }))}
              />
            </label>
            <label>
              <span>{"Liberado / comercializ\u00e1vel (L)"}</span>
              <input type="number" value={computedMarketable.toFixed(2)} disabled />
            </label>
            <label className="farm-milk-form__full">
              <span>{"Observa\u00e7\u00f5es"}</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </label>
            <div className="farm-milk-form__actions">
              <Button variant="primary" onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar dia"}
              </Button>
            </div>
          </div>
        </Card>

        <Card
          className="farm-milk-card"
          title={"Vis\u00e3o di\u00e1ria"}
          description="Leitura operacional do dia selecionado."
        >
          {loadingDaily ? <LoadingState label="Carregando dia..." /> : null}
          {!loadingDaily && dailyError ? <Alert variant="danger" title="Erro ao carregar o dia">{dailyError}</Alert> : null}
          {!loadingDaily && !dailyError && (
            <>
              <div className="farm-milk-stats">
                <article className="farm-milk-stat">
                  <span>Total registrado</span>
                  <strong>{formatVolume(dailySummary.totalProduced)}</strong>
                </article>
                <article className="farm-milk-stat">
                  <span>Restrito</span>
                  <strong>{formatVolume(dailySummary.withdrawalProduced)}</strong>
                </article>
                <article className="farm-milk-stat">
                  <span>Liberado</span>
                  <strong>{formatVolume(dailySummary.marketableProduced)}</strong>
                </article>
              </div>
              <div className="farm-milk-note">
                <span>Status do dia</span>
                <strong>{dailySummary.registered ? "Consolidado registrado" : "Nenhum consolidado salvo"}</strong>
                <p>{dailySummary.notes || "Sem observações para esta data."}</p>
              </div>
            </>
          )}
        </Card>
      </section>

      <section className="farm-milk-grid farm-milk-grid--summary">
        <Card
          className="farm-milk-card"
          title={"Vis\u00e3o mensal"}
          description={"Totaliza os registros di\u00e1rios consolidados do m\u00eas selecionado."}
        >
          <div className="farm-milk-toolbar">
            <label>
              <span>{"M\u00eas"}</span>
              <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
            </label>
          </div>
          {loadingMonth ? <LoadingState label={"Carregando m\u00eas..."} /> : null}
          {!loadingMonth && monthError ? <Alert variant="danger" title={"Erro ao carregar o m\u00eas"}>{monthError}</Alert> : null}
          {!loadingMonth && !monthError && (
            <>
              <div className="farm-milk-stats">
                <article className="farm-milk-stat">
                  <span>{"Total do m\u00eas"}</span>
                  <strong>{formatVolume(monthlySummary.totalProduced)}</strong>
                </article>
                <article className="farm-milk-stat">
                  <span>{"Restrito no m\u00eas"}</span>
                  <strong>{formatVolume(monthlySummary.withdrawalProduced)}</strong>
                </article>
                <article className="farm-milk-stat">
                  <span>{"Liberado no m\u00eas"}</span>
                  <strong>{formatVolume(monthlySummary.marketableProduced)}</strong>
                </article>
              </div>
              {monthlySummary.dailyRecords.length === 0 ? (
                <EmptyState title={"Sem consolidado no m\u00eas"} description={"Ainda n\u00e3o h\u00e1 registros di\u00e1rios consolidados para este m\u00eas."} />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Total</th>
                      <th>Restrito</th>
                      <th>Liberado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummary.dailyRecords.map((record) => (
                      <tr key={record.productionDate}>
                        <td>{formatDate(record.productionDate)}</td>
                        <td>{formatVolume(record.totalProduced)}</td>
                        <td>{formatVolume(record.withdrawalProduced)}</td>
                        <td>{formatVolume(record.marketableProduced)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Card>

        <Card
          className="farm-milk-card"
          title={"Vis\u00e3o anual"}
          description="Acumulado do ano, organizado por mês."
        >
          <div className="farm-milk-toolbar">
            <label>
              <span>Ano</span>
              <input
                type="number"
                min="2020"
                max="2100"
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
              />
            </label>
          </div>
          {loadingYear ? <LoadingState label="Carregando ano..." /> : null}
          {!loadingYear && yearError ? <Alert variant="danger" title="Erro ao carregar o ano">{yearError}</Alert> : null}
          {!loadingYear && !yearError && (
            <>
              <div className="farm-milk-stats">
                <article className="farm-milk-stat">
                  <span>Total do ano</span>
                  <strong>{formatVolume(annualSummary.totalProduced)}</strong>
                </article>
                <article className="farm-milk-stat">
                  <span>Restrito no ano</span>
                  <strong>{formatVolume(annualSummary.withdrawalProduced)}</strong>
                </article>
                <article className="farm-milk-stat">
                  <span>Liberado no ano</span>
                  <strong>{formatVolume(annualSummary.marketableProduced)}</strong>
                </article>
              </div>
              <Table>
                <thead>
                  <tr>
                    <th>{"M\u00eas"}</th>
                    <th>Total</th>
                    <th>Restrito</th>
                    <th>Liberado</th>
                    <th>Dias</th>
                  </tr>
                </thead>
                <tbody>
                  {annualSummary.monthlyRecords.map((record) => (
                    <tr key={record.month}>
                      <td>{String(record.month).padStart(2, "0")}/{annualSummary.year}</td>
                      <td>{formatVolume(record.totalProduced)}</td>
                      <td>{formatVolume(record.withdrawalProduced)}</td>
                      <td>{formatVolume(record.marketableProduced)}</td>
                      <td>{record.daysRegistered}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Card>
      </section>
    </div>
  );
}



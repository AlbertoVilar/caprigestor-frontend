import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ContextBreadcrumb from "../../Components/pages-headers/ContextBreadcrumb";
import { EmptyState, ErrorState, LoadingState } from "../../Components/ui";
import GoatGenealogyTree from "../../Components/goat-genealogy/GoatGenealogyTree";
import { adaptHistoricalGenealogyToPresentational } from "./adapters/historicalGenealogyAdapter";
import type {
  FarmGoatHistoricalMilkLactationResponseDTO,
  FarmGoatRegistryHistoricalDossierBasicDTO,
  FarmGoatRegistryHistoricalGenealogyDTO,
} from "../../Models/FarmGoatHistoricalDossierDTOs";
import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import {
  getFarmGoatRegistryHistoricalDossierBasic,
  getFarmGoatRegistryHistoricalGenealogy,
  getFarmGoatRegistryHistoricalMilkLactation,
} from "../../api/GoatOwnershipAPI/farmGoatRegistryHistoricalDossier";
import {
  DISPOSITION_LABELS,
  GLOBAL_STATUS_LABELS,
  ROLE_LABELS,
} from "../goat-registry/components/FarmGoatRegistryItemRow";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import {
  buildFarmDashboardPath,
  buildFarmGoatRegistryPath,
  isValidGoatTechnicalToken,
} from "../../utils/appRoutes";
import "./FarmGoatRegistryHistoricalDossierPage.css";

const SHIFT_LABELS: Record<string, string> = {
  TOTAL_DAY: "Dia Completo",
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
};

const LACTATION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativa",
  DRY: "Seca",
  CLOSED: "Encerrada",
};

export default function FarmGoatRegistryHistoricalDossierPage() {
  const { farmId, goatIdToken } = useParams<{ farmId: string; goatIdToken: string }>();

  const farmIdNumber = Number(farmId);
  const isValidFarmId = Number.isSafeInteger(farmIdNumber) && farmIdNumber > 0;
  const isValidToken = isValidGoatTechnicalToken(goatIdToken);

  const [dossier, setDossier] = useState<FarmGoatRegistryHistoricalDossierBasicDTO | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierError, setDossierError] = useState<unknown>(null);

  const [genealogyRaw, setGenealogyRaw] = useState<FarmGoatRegistryHistoricalGenealogyDTO | null>(null);
  const [genealogyLoading, setGenealogyLoading] = useState(false);
  const [genealogyError, setGenealogyError] = useState<unknown>(null);

  const [abccLoading, setAbccLoading] = useState(false);
  const [abccError, setAbccError] = useState<string | null>(null);

  const [milkLactation, setMilkLactation] = useState<FarmGoatHistoricalMilkLactationResponseDTO | null>(null);
  const [milkLactationLoading, setMilkLactationLoading] = useState(false);
  const [milkLactationError, setMilkLactationError] = useState<unknown>(null);

  const fetchBasicDossier = useCallback(async () => {
    if (!isValidFarmId || !isValidToken) return;

    setDossierLoading(true);
    setDossierError(null);
    try {
      const result = await getFarmGoatRegistryHistoricalDossierBasic(farmIdNumber, goatIdToken!);
      setDossier(result);
    } catch (err) {
      setDossierError(err);
      setDossier(null);
    } finally {
      setDossierLoading(false);
    }
  }, [farmIdNumber, goatIdToken, isValidFarmId, isValidToken]);

  const fetchGenealogy = useCallback(
    async (isAbccComplement = false) => {
      if (!isValidFarmId || !isValidToken) return;

      if (isAbccComplement) {
        setAbccLoading(true);
        setAbccError(null);
      } else {
        setGenealogyLoading(true);
        setGenealogyError(null);
      }

      try {
        const result = await getFarmGoatRegistryHistoricalGenealogy(
          farmIdNumber,
          goatIdToken!,
          isAbccComplement
        );
        setGenealogyRaw(result);
      } catch (err) {
        if (isAbccComplement) {
          setAbccError(
            "Não foi possível consultar a ABCC no momento. Exibindo apenas a genealogia local."
          );
        } else {
          setGenealogyError(err);
        }
      } finally {
        if (isAbccComplement) {
          setAbccLoading(false);
        } else {
          setGenealogyLoading(false);
        }
      }
    },
    [farmIdNumber, goatIdToken, isValidFarmId, isValidToken]
  );

  const fetchMilkLactation = useCallback(async () => {
    if (!isValidFarmId || !isValidToken) return;

    setMilkLactationLoading(true);
    setMilkLactationError(null);
    try {
      const result = await getFarmGoatRegistryHistoricalMilkLactation(farmIdNumber, goatIdToken!);
      setMilkLactation(result);
    } catch (err) {
      setMilkLactationError(err);
      setMilkLactation(null);
    } finally {
      setMilkLactationLoading(false);
    }
  }, [farmIdNumber, goatIdToken, isValidFarmId, isValidToken]);

  const loadInitialData = useCallback(async () => {
    if (!isValidFarmId || !isValidToken) return;
    await Promise.allSettled([fetchBasicDossier(), fetchGenealogy(false), fetchMilkLactation()]);
  }, [fetchBasicDossier, fetchGenealogy, fetchMilkLactation, isValidFarmId, isValidToken]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const milkKpis = useMemo(() => {
    if (!milkLactation) {
      return { totalMilkLiters: 0, totalProductions: 0, activeLactations: 0, closedLactations: 0 };
    }
    const totalMilkLiters = milkLactation.milkProductions
      .filter((p) => p.status !== "CANCELED")
      .reduce((sum, p) => sum + Number(p.volumeLiters || 0), 0);
    const totalProductions = milkLactation.milkProductions.length;
    const activeLactations = milkLactation.lactations.filter((l) => l.active).length;
    const closedLactations = milkLactation.lactations.filter((l) => !l.active).length;
    return { totalMilkLiters, totalProductions, activeLactations, closedLactations };
  }, [milkLactation]);

  const normalizedGenealogy: GoatGenealogyDTO | null = useMemo(() => {
    if (!genealogyRaw) return null;
    return adaptHistoricalGenealogyToPresentational(genealogyRaw);
  }, [genealogyRaw]);

  if (!isValidFarmId || !isValidToken) {
    return (
      <main className="dossier-page">
        <ErrorState
          title="Parâmetros inválidos"
          description="O identificador da fazenda ou o token técnico do animal informado na rota é inválido."
        />
      </main>
    );
  }

  const dossierErrorStatus = (() => {
    if (typeof dossierError !== "object" || dossierError === null) return undefined;
    const candidate = dossierError as { response?: { status?: unknown }; status?: unknown };
    if (typeof candidate.response?.status === "number") return candidate.response.status;
    if (typeof candidate.status === "number") return candidate.status;
    return undefined;
  })();

  const isForbidden = dossierErrorStatus === 403;
  const isNotFound = dossierErrorStatus === 404;

  if (dossierLoading) {
    return (
      <main className="dossier-page">
        <LoadingState label="Carregando ficha histórica do registro..." />
      </main>
    );
  }

  if (dossierError) {
    return (
      <main className="dossier-page">
        <ErrorState
          title={
            isForbidden
              ? "Acesso negado"
              : isNotFound
              ? "Animal não encontrado"
              : "Não foi possível carregar a ficha histórica"
          }
          description={
            isForbidden
              ? "Você não tem permissão para consultar a ficha histórica deste animal no registro da fazenda."
              : isNotFound
              ? "O animal não foi encontrado no livro de registro desta fazenda."
              : getApiErrorMessage(parseApiError(dossierError))
          }
          retryLabel={isForbidden || isNotFound ? undefined : "Tentar novamente"}
          onRetry={isForbidden || isNotFound ? undefined : fetchBasicDossier}
        />
      </main>
    );
  }

  if (!dossier) {
    return (
      <main className="dossier-page">
        <EmptyState
          title="Ficha histórica indisponível"
          description="Nenhum dado encontrado para o registro solicitado."
        />
      </main>
    );
  }

  const creatorDisplay = dossier.creatorNameSnapshot
    ? dossier.creatorNameSnapshot
    : "Não informada";

  const provenanceDisplay =
    dossier.creatorFarmId === farmIdNumber
      ? "Criado nesta fazenda"
      : dossier.creatorFarmId != null
      ? `Fazenda de origem #${dossier.creatorFarmId}`
      : null;

  const currentOwnerDisplay =
    dossier.currentOwnerFarmId === farmIdNumber
      ? "Esta fazenda"
      : dossier.currentOwnerFarmId != null
      ? `Fazenda #${dossier.currentOwnerFarmId}`
      : "Sem fazenda proprietária atual registrada no CapriGestor";

  const integrationStatus = genealogyRaw?.integration?.status;
  const integrationMessage = genealogyRaw?.integration?.message;

  return (
    <main className="dossier-page">
      <ContextBreadcrumb
        items={[
          { label: "Fazendas", to: "/goatfarms" },
          {
            label: `Fazenda #${farmIdNumber}`,
            to: buildFarmDashboardPath(farmIdNumber),
          },
          {
            label: "Registro de Animais",
            to: buildFarmGoatRegistryPath(farmIdNumber),
          },
          { label: `Ficha Histórica: ${dossier.name}` },
        ]}
      />

      <header className="dossier-header">
        <div className="dossier-header-main">
          <div className="dossier-title-area">
            <h1 className="dossier-title">{dossier.name}</h1>
            <span className="dossier-rg">RG: {dossier.registrationNumber || "-"}</span>
          </div>
          <div className="dossier-badges">
            <span
              className={`dossier-badge dossier-badge--global-${dossier.globalStatus.toLowerCase()}`}
            >
              {GLOBAL_STATUS_LABELS[dossier.globalStatus] ?? dossier.globalStatus}
            </span>
            <span
              className={`dossier-badge dossier-badge--disp-${dossier.disposition.toLowerCase()}`}
            >
              {DISPOSITION_LABELS[dossier.disposition] ?? dossier.disposition}
            </span>
            <span className="dossier-readonly-tag">
              <i className="fa-solid fa-lock" aria-hidden="true" /> Ficha Histórica Registrada (Somente Leitura)
            </span>
          </div>
        </div>
      </header>

      <section className="dossier-grid">
        {/* Card A: Technical Identification */}
        <div className="dossier-card">
          <h2 className="dossier-card-title">
            <i className="fa-solid fa-dna" aria-hidden="true" /> Identificação e Dados Técnicos
          </h2>
          <dl className="dossier-dl">
            <div className="dossier-dl-row">
              <dt>Sexo:</dt>
              <dd>{dossier.gender === "MACHO" ? "Macho" : dossier.gender === "FEMEA" ? "Fêmea" : dossier.gender}</dd>
            </div>
            <div className="dossier-dl-row">
              <dt>Raça:</dt>
              <dd>{dossier.breed || "Não informada"}</dd>
            </div>
            <div className="dossier-dl-row">
              <dt>Pelagem:</dt>
              <dd>{dossier.color || "Não informada"}</dd>
            </div>
            <div className="dossier-dl-row">
              <dt>Data de Nascimento:</dt>
              <dd>{dossier.birthDate || "Não informada"}</dd>
            </div>
            <div className="dossier-dl-row">
              <dt>Categoria:</dt>
              <dd>{dossier.category || "Não informada"}</dd>
            </div>
            <div className="dossier-dl-row">
              <dt>TOD (Orelha Direita):</dt>
              <dd>{dossier.tod || "-"}</dd>
            </div>
            <div className="dossier-dl-row">
              <dt>TOE (Orelha Esquerda):</dt>
              <dd>{dossier.toe || "-"}</dd>
            </div>
          </dl>
        </div>

        {/* Card B: Registry Context and Farm Ownership Links */}
        <div className="dossier-card">
          <h2 className="dossier-card-title">
            <i className="fa-solid fa-book-bookmark" aria-hidden="true" /> Contexto no Livro de Registro
          </h2>
          <dl className="dossier-dl">
            <div className="dossier-dl-row">
              <dt>Origem registral:</dt>
              <dd>
                <strong>{creatorDisplay}</strong>
                {provenanceDisplay && (
                  <span className="dossier-subtext"> ({provenanceDisplay})</span>
                )}
              </dd>
            </div>
            <div className="dossier-dl-row">
              <dt>Papéis Registrados:</dt>
              <dd className="dossier-roles-list">
                {dossier.roles.map((role) => (
                  <span
                    key={role}
                    className={`dossier-role-pill dossier-role-pill--${role.toLowerCase()}`}
                  >
                    {ROLE_LABELS[role] ?? role}
                  </span>
                ))}
              </dd>
            </div>
            <div className="dossier-dl-row">
              <dt>Relação com a Fazenda:</dt>
              <dd>{DISPOSITION_LABELS[dossier.disposition] ?? dossier.disposition}</dd>
            </div>
            <div className="dossier-dl-row">
              <dt>Fazenda proprietária atual:</dt>
              <dd>
                <span className="dossier-owner-val">{currentOwnerDisplay}</span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Card C: Summary Direct Lineage */}
        <div className="dossier-card dossier-card--full">
          <h2 className="dossier-card-title">
            <i className="fa-solid fa-sitemap" aria-hidden="true" /> Filiação Direta Resumida
          </h2>
          <div className="dossier-parent-summary-grid">
            <div className="dossier-parent-box">
              <span className="dossier-parent-label">Pai Declarado / Registrado:</span>
              <strong className="dossier-parent-name">{dossier.fatherName || "Não informado"}</strong>
              <span className="dossier-parent-rg">
                {dossier.fatherRegistrationNumber ? `RG: ${dossier.fatherRegistrationNumber}` : "-"}
              </span>
            </div>
            <div className="dossier-parent-box">
              <span className="dossier-parent-label">Mãe Declarada / Registrada:</span>
              <strong className="dossier-parent-name">{dossier.motherName || "Não informada"}</strong>
              <span className="dossier-parent-rg">
                {dossier.motherRegistrationNumber ? `RG: ${dossier.motherRegistrationNumber}` : "-"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Card D: Historical Genealogy Tree & ABCC Complementation */}
      <section className="dossier-card dossier-card--full dossier-genealogy-section">
        <div className="dossier-genealogy-header">
          <div>
            <h2 className="dossier-card-title">
              <i className="fa-solid fa-diagram-project" aria-hidden="true" /> Árvore Genealógica Histórica
            </h2>
            <p className="dossier-genealogy-desc">
              Visualização estrutural em três gerações (Pais, Avós e Bisavós) com origem estrita de dados (LOCAL, DECLARADO, ABCC ou AUSENTE).
            </p>
          </div>
          <div className="dossier-abcc-action-area">
            <button
              type="button"
              className="btn btn-primary dossier-abcc-btn"
              onClick={() => fetchGenealogy(true)}
              disabled={abccLoading || genealogyLoading}
              aria-label="Enriquecer genealogia com dados da ABCC"
            >
              {abccLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                  <span>Consultando ABCC...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-down" aria-hidden="true" />
                  <span>Enriquecer com dados ABCC</span>
                </>
              )}
            </button>
          </div>
        </div>

        {abccError && (
          <div className="dossier-integration-banner dossier-integration-banner--unavailable" role="alert">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            <span>{abccError}</span>
          </div>
        )}

        {integrationStatus && (
          <div
            className={`dossier-integration-banner dossier-integration-banner--${integrationStatus.toLowerCase()}`}
            role="status"
          >
            <i
              className={`fa-solid ${
                integrationStatus === "FOUND"
                  ? "fa-circle-check"
                  : integrationStatus === "UNAVAILABLE"
                  ? "fa-triangle-exclamation"
                  : "fa-circle-info"
              }`}
              aria-hidden="true"
            />
            <span>{integrationMessage || `Status de integração ABCC: ${integrationStatus}`}</span>
          </div>
        )}

        {genealogyLoading ? (
          <LoadingState label="Carregando árvore genealógica..." />
        ) : genealogyError ? (
          <ErrorState
            title="Não foi possível carregar a genealogia"
            description={getApiErrorMessage(parseApiError(genealogyError))}
            retryLabel="Tentar novamente"
            onRetry={() => fetchGenealogy(false)}
          />
        ) : normalizedGenealogy ? (
          <GoatGenealogyTree data={normalizedGenealogy} />
        ) : (
          <EmptyState
            title="Genealogia indisponível"
            description="Não foi possível processar a árvore genealógica histórica deste animal."
          />
        )}
      </section>

      {/* Card E: Historical Milk & Lactation Records */}
      <section className="dossier-card dossier-card--full dossier-milk-section">
        <div className="dossier-milk-header">
          <div>
            <h2 className="dossier-card-title">
              <i className="fa-solid fa-bottle-droplet" aria-hidden="true" /> Lactações & Produção de Leite
            </h2>
            <p className="dossier-milk-desc">
              Histórico de lactações relacionadas à fazenda e ordenhas registradas nela
            </p>
          </div>
        </div>

        {milkLactationLoading ? (
          <LoadingState label="Carregando dados de lactação e produção..." />
        ) : milkLactationError ? (
          <ErrorState
            title="Não foi possível carregar os dados de leite e lactação"
            description={getApiErrorMessage(parseApiError(milkLactationError))}
            retryLabel="Tentar novamente"
            onRetry={fetchMilkLactation}
          />
        ) : milkLactation ? (
          <div className="dossier-milk-content">
            {/* KPI Summary Cards */}
            <div className="dossier-kpi-grid">
              <div className="dossier-kpi-card">
                <span className="dossier-kpi-label">Total de Leite Registrado</span>
                <strong className="dossier-kpi-value">{milkKpis.totalMilkLiters.toFixed(2)} L</strong>
                <span className="dossier-kpi-subtext">Produzido nesta fazenda</span>
              </div>
              <div className="dossier-kpi-card">
                <span className="dossier-kpi-label">Registros de Ordenha</span>
                <strong className="dossier-kpi-value">{milkKpis.totalProductions}</strong>
                <span className="dossier-kpi-subtext">Pesagens aferidas</span>
              </div>
              <div className="dossier-kpi-card">
                <span className="dossier-kpi-label">Lactações Ativas</span>
                <strong className="dossier-kpi-value">{milkKpis.activeLactations}</strong>
                <span className="dossier-kpi-subtext">Em curso</span>
              </div>
              <div className="dossier-kpi-card">
                <span className="dossier-kpi-label">Lactações Encerradas</span>
                <strong className="dossier-kpi-value">{milkKpis.closedLactations}</strong>
                <span className="dossier-kpi-subtext">Ciclos finalizados</span>
              </div>
            </div>

            {milkLactation.lactations.length === 0 && milkLactation.milkProductions.length === 0 ? (
              <EmptyState
                title="Sem registros produtivos"
                description="Nenhum registro histórico de lactação ou ordenha vinculado a esta fazenda."
              />
            ) : (
              <>
                {/* Lactações Sub-card */}
                <div className="dossier-subtable-container">
                  <h3 className="dossier-subtable-title">
                    <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Lactações Registradas ({milkLactation.lactations.length})
                  </h3>
                  {milkLactation.lactations.length === 0 ? (
                    <p className="dossier-empty-note">Nenhuma lactação registrada para este animal no escopo desta fazenda.</p>
                  ) : (
                    <div className="dossier-table-wrapper">
                      <table className="dossier-table" aria-label="Tabela de lactações históricas">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Status</th>
                            <th>Início</th>
                            <th>Término</th>
                            <th>Secagem</th>
                            <th>Descanso</th>
                            <th>Origem / Proveniência</th>
                          </tr>
                        </thead>
                        <tbody>
                          {milkLactation.lactations.map((lac) => (
                            <tr key={lac.id}>
                              <td><strong>#{lac.id}</strong></td>
                              <td>
                                <span className={`dossier-badge dossier-badge--status-${lac.status.toLowerCase()}`}>
                                  {LACTATION_STATUS_LABELS[lac.status] ?? lac.status}
                                </span>
                              </td>
                              <td>{lac.startDate}</td>
                              <td>{lac.endDate ?? "Em andamento"}</td>
                              <td>{lac.dryStartDate ?? "-"}</td>
                              <td>{lac.restDays != null ? `${lac.restDays} dias` : "-"}</td>
                              <td>
                                {lac.farmId === farmIdNumber ? (
                                  <span className="dossier-provenance-tag dossier-provenance-tag--local">Iniciada nesta fazenda</span>
                                ) : (
                                  <span className="dossier-provenance-tag dossier-provenance-tag--inherited">
                                    Iniciada na Fazenda #{lac.farmId}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Produções Sub-card */}
                <div className="dossier-subtable-container">
                  <h3 className="dossier-subtable-title">
                    <i className="fa-solid fa-list-check" aria-hidden="true" /> Registros de Ordenha ({milkLactation.milkProductions.length})
                  </h3>
                  {milkLactation.milkProductions.length === 0 ? (
                    <p className="dossier-empty-note">Nenhum registro de ordenha realizado nesta fazenda.</p>
                  ) : (
                    <div className="dossier-table-wrapper">
                      <table className="dossier-table" aria-label="Tabela de ordenhas históricas">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Turno</th>
                            <th>Volume</th>
                            <th>Lactação</th>
                            <th>Status</th>
                            <th>Observações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {milkLactation.milkProductions.map((prod) => (
                            <tr key={prod.id} className={prod.status === "CANCELED" ? "dossier-row--canceled" : undefined}>
                              <td>{prod.date}</td>
                              <td>{SHIFT_LABELS[prod.shift] ?? prod.shift}</td>
                              <td><strong>{Number(prod.volumeLiters).toFixed(2)} L</strong></td>
                              <td>{prod.lactationId ? `#${prod.lactationId}` : "-"}</td>
                              <td>
                                <span className={`dossier-badge dossier-badge--prod-${prod.status.toLowerCase()}`}>
                                  {prod.status === "ACTIVE" ? "Ativo" : "Cancelado"}
                                </span>
                                {prod.status === "CANCELED" && prod.canceledReason && (
                                  <span className="dossier-canceled-reason"> ({prod.canceledReason})</span>
                                )}
                              </td>
                              <td>
                                {prod.recordedDuringMilkWithdrawal && (
                                  <span className="dossier-badge dossier-badge--withdrawal" title={prod.milkWithdrawalSource ?? "Período de Carência"}>
                                    <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Carência
                                  </span>
                                )}
                                {prod.notes ? <span className="dossier-notes-text">{prod.notes}</span> : !prod.recordedDuringMilkWithdrawal ? "-" : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}

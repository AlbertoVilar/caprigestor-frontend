import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { Alert, Button, Card, EmptyState, LoadingState, Modal, Table } from "../../Components/ui";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import {
  cancelMilkProduction,
  createMilkProduction,
  getMilkProductionById,
  listMilkProductions,
  patchMilkProduction,
} from "../../api/GoatFarmAPI/milkProduction";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { usePermissions } from "../../Hooks/usePermissions";
import type { GoatWithdrawalStatusDTO } from "../../Models/HealthDTOs";
import type {
  MilkProductionRequestDTO,
  MilkProductionResponseDTO,
  MilkProductionStatus,
  MilkProductionUpdateRequestDTO,
  MilkingShift,
} from "../../Models/MilkProductionDTOs";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { parseApiError, type ParsedApiError } from "../../utils/apiError";
import { formatLocalDatePtBR, getTodayLocalDate } from "../../utils/localDate";
import "./milkProductionPage.css";

const formatDate = (date?: string | null) => formatLocalDatePtBR(date);

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
};

const formatVolume = (volume: number | string | null | undefined) => {
  if (volume === null || volume === undefined) return "-";
  const num = Number(volume);
  if (Number.isNaN(num)) return "-";
  return `${num.toFixed(2)} L`;
};

const shifts: { value: MilkingShift; label: string }[] = [
  { value: "TOTAL_DAY", label: "Total do dia" },
  { value: "MORNING", label: "Manhã" },
  { value: "AFTERNOON", label: "Tarde" },
];

const statusLabels: Record<MilkProductionStatus, string> = {
  ACTIVE: "Ativa",
  CANCELED: "Cancelada",
};

type MilkAction = "list" | "create" | "edit" | "detail" | "cancel";

const getMilkErrorMessage = (parsed: ParsedApiError, action: MilkAction): string => {
  const backendMessage = parsed.message?.trim();

  if (action === "detail" && parsed.status === 404) {
    return "Registro não encontrado.";
  }

  if (parsed.status === 422 && backendMessage) {
    return backendMessage;
  }

  if (parsed.status === 409 && backendMessage) {
    return backendMessage;
  }

  if (parsed.status === 403) {
    return "Sem permissão para acessar esta fazenda.";
  }

  if (parsed.status === 401) {
    return backendMessage || "Não autenticado.";
  }

  return backendMessage || "Erro inesperado. Tente novamente.";
};

export default function MilkProductionPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [withdrawalStatus, setWithdrawalStatus] = useState<GoatWithdrawalStatusDTO | null>(null);
  const [productions, setProductions] = useState<MilkProductionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    includeCanceled: false,
  });

  const [showFormModal, setShowFormModal] = useState(false);
  const [editing, setEditing] = useState<MilkProductionResponseDTO | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    date?: string;
    shift?: string;
    volumeLiters?: string;
  }>({});
  const [form, setForm] = useState<MilkProductionRequestDTO>({
    date: "",
    shift: "TOTAL_DAY",
    volumeLiters: 0,
    notes: "",
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<MilkProductionResponseDTO | null>(null);

  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const { canManageMilkProduction } = useFarmPermissions(farmIdNumber);
  const canManage = permissions.isAdmin() || canManageMilkProduction;
  const isEditingCanceled = editing?.status === "CANCELED";
  const hasCurrentMilkWithdrawal = Boolean(withdrawalStatus?.hasActiveMilkWithdrawal);

  const stats = useMemo(() => {
    const total = productions.reduce((sum, item) => sum + Number(item.volumeLiters || 0), 0);
    const average = productions.length ? total / productions.length : 0;
    return { total, average };
  }, [productions]);

  const loadData = async (pageOverride = page) => {
    if (!farmId || !goatId || Number.isNaN(farmIdNumber)) return;
    try {
      setLoading(true);
      const [list, goatData, withdrawalData] = await Promise.all([
        listMilkProductions(farmIdNumber, goatId, {
          page: pageOverride,
          size: 10,
          sort: ["date,desc", "shift,asc", "id,desc"],
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          includeCanceled: filters.includeCanceled || undefined,
        }),
        fetchGoatById(farmIdNumber, goatId).catch(() => null),
        healthAPI.getWithdrawalStatus(farmIdNumber, goatId).catch(() => null),
      ]);

      setProductions(list.content || []);
      setTotalPages(list.totalPages || 0);
      setTotalElements(list.totalElements || 0);
      if (goatData) setGoat(goatData);
      setWithdrawalStatus(withdrawalData);
    } catch (error) {
      console.error("Erro ao carregar produção de leite", error);
      const parsed = parseApiError(error);
      toast.error(getMilkErrorMessage(parsed, "list"));
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: number, openModal = true) => {
    if (!farmId || !goatId || Number.isNaN(farmIdNumber)) return;
    if (openModal) {
      setShowDetailModal(true);
    }
    try {
      setDetailLoading(true);
      setDetailError(null);
      const response = await getMilkProductionById(farmIdNumber, goatId, id);
      setDetail(response);
      if (editing?.id === response.id) {
        setEditing(response);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da produção", error);
      const parsed = parseApiError(error);
      const message = getMilkErrorMessage(parsed, "detail");
      setDetail(null);
      setDetailError(message);
      toast.error(message);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    void loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, goatId, filters.dateFrom, filters.dateTo, filters.includeCanceled]);

  const resetForm = () => {
    setForm({
      date: getTodayLocalDate(),
      shift: "TOTAL_DAY",
      volumeLiters: 0,
      notes: "",
    });
    setEditing(null);
    setSubmitError(null);
    setFormErrors({});
  };

  const openCreate = () => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    resetForm();
    setShowFormModal(true);
  };

  const openEdit = (entry: MilkProductionResponseDTO) => {
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (entry.status === "CANCELED") {
      toast.info("Registro cancelado não pode ser alterado.");
      return;
    }
    setSubmitError(null);
    setEditing(entry);
    setForm({
      date: entry.date,
      shift: entry.shift,
      volumeLiters: Number(entry.volumeLiters || 0),
      notes: entry.notes || "",
    });
    setShowFormModal(true);
  };

  const handleOpenDetail = (entry: MilkProductionResponseDTO) => {
    setShowDetailModal(true);
    setDetail(entry);
    setDetailError(null);
    void loadDetail(entry.id, false);
  };

  const handleSubmit = async () => {
    if (!farmId || !goatId || Number.isNaN(farmIdNumber)) return;
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (editing && editing.status === "CANCELED") {
      setSubmitError("Registro cancelado não pode ser alterado.");
      return;
    }

    const errors: typeof formErrors = {};
    if (!editing && !form.date) {
      errors.date = "Informe a data da produção.";
    }
    if (!editing && !form.shift) {
      errors.shift = "Selecione o turno da ordenha.";
    }
    if (!form.volumeLiters || Number(form.volumeLiters) <= 0) {
      errors.volumeLiters = "Informe o volume em litros (maior que 0).";
    }
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitError(null);
      if (editing) {
        const payload: MilkProductionUpdateRequestDTO = {
          volumeLiters: Number(form.volumeLiters),
          notes: form.notes || undefined,
        };
        const updated = await patchMilkProduction(farmIdNumber, goatId, editing.id, payload);
        toast.success("Produção atualizada.");
        if (detail?.id === updated.id) {
          setDetail(updated);
        }
        setShowFormModal(false);
        resetForm();
        await loadData(page);
      } else {
        const payload: MilkProductionRequestDTO = {
          date: form.date,
          shift: form.shift,
          volumeLiters: Number(form.volumeLiters),
          notes: form.notes || undefined,
        };
        const created = await createMilkProduction(farmIdNumber, goatId, payload);
        if (created.recordedDuringMilkWithdrawal) {
          toast.success(
            `Produção registrada em carência até ${formatDate(created.milkWithdrawalEndDate)}. O volume segue no histórico, mas exige restrição sanitária de uso.`
          );
        } else {
          toast.success("Produção registrada.");
        }
        setShowFormModal(false);
        resetForm();
        setPage(0);
        await loadData(0);
      }
    } catch (error) {
      console.error("Erro ao salvar produção", error);
      const parsed = parseApiError(error);
      const message = getMilkErrorMessage(parsed, editing ? "edit" : "create");
      setSubmitError(message);
      toast.error(message);

      if (editing && parsed.status === 422) {
        try {
          const refreshed = await getMilkProductionById(farmIdNumber, goatId, editing.id);
          setEditing(refreshed);
          setForm({
            date: refreshed.date,
            shift: refreshed.shift,
            volumeLiters: Number(refreshed.volumeLiters || 0),
            notes: refreshed.notes || "",
          });
          if (detail?.id === refreshed.id) {
            setDetail(refreshed);
          }
          await loadData(page);
        } catch (refreshError) {
          console.error("Erro ao atualizar o estado da produção após falha no PATCH", refreshError);
        }
      }
    }
  };

  const handleCancel = async (entry: MilkProductionResponseDTO) => {
    if (!farmId || !goatId || Number.isNaN(farmIdNumber)) return;
    if (!canManage) {
      toast.error("Sem permissão para esta ação.");
      return;
    }
    if (entry.status === "CANCELED") {
      toast.info("Registro já está cancelado.");
      return;
    }

    const ok = window.confirm(
      "Tem certeza que deseja cancelar este registro? Ele não será removido, apenas marcado como cancelado."
    );
    if (!ok) return;

    try {
      await cancelMilkProduction(farmIdNumber, goatId, entry.id);
      toast.success("Registro cancelado.");
      await loadData(page);

      if (showDetailModal && detail?.id === entry.id) {
        await loadDetail(entry.id, false);
      }
      if (editing?.id === entry.id) {
        const refreshed = await getMilkProductionById(farmIdNumber, goatId, entry.id);
        setEditing(refreshed);
        setForm({
          date: refreshed.date,
          shift: refreshed.shift,
          volumeLiters: Number(refreshed.volumeLiters || 0),
          notes: refreshed.notes || "",
        });
      }
    } catch (error) {
      console.error("Erro ao cancelar produção", error);
      const parsed = parseApiError(error);
      toast.error(getMilkErrorMessage(parsed, "cancel"));
    }
  };

  if (loading) {
    return <LoadingState label="Carregando produções de leite..." />;
  }

  return (
    <div className="milk-production-page lactation-page">
      <section className="lactation-page__hero">
        <PageHeader
          title="Produção de leite"
          subtitle={`${goat?.name || goatId} · Registro ${goatId} · Fazenda · Cabra`}
          showBackButton
          backTo={`/app/goatfarms/${farmId}/goats/${goatId}`}
          actions={
            <div className="lactation-page__actions">
              <Button
                variant="outline"
                onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/lactations`)}
              >
                <i className="fa-solid fa-circle-nodes" aria-hidden="true"></i> Lactações
              </Button>
            </div>
          }
        />
      </section>

      <section className="lactation-panel-grid">
        {hasCurrentMilkWithdrawal && withdrawalStatus?.milkWithdrawal ? (
          <Alert variant="warning" title="Carencia sanitaria ativa">
            Este animal está em carência de leite até {formatDate(withdrawalStatus.milkWithdrawal.withdrawalEndDate)} por {withdrawalStatus.milkWithdrawal.productName || withdrawalStatus.milkWithdrawal.title || "tratamento sanitario"}. A produção pode continuar sendo registrada para controle zootécnico, mas deve permanecer restrita para uso comercial.
          </Alert>
        ) : null}
        <Card className="lactation-panel lactation-panel--soft">
          <span className="lactation-panel__eyebrow">
            {productions.length === 0 ? "Primeiros passos" : "Visão geral"}
          </span>
          <h3 className="lactation-panel__title">
            {productions.length === 0 ? "Pronto para o primeiro registro" : "Produção recente"}
          </h3>
          <p className="lactation-panel__description">
            {productions.length === 0
              ? "Use o botão ao lado para registrar a primeira ordenha desta cabra e começar o acompanhamento."
              : "Consulte o histórico de ordenha desta cabra, acompanhe o volume coletado e filtre por período sem sair desta página."}
          </p>
          <div className="lactation-panel__meta">
            <div className="lactation-panel__meta-card">
              <span className="lactation-panel__meta-label">Animal</span>
              <p className="lactation-panel__meta-value">{goat?.name || goatId}</p>
            </div>
            {productions.length === 0 ? (
              <>
                <div className="lactation-panel__meta-card">
                  <span className="lactation-panel__meta-label">Registros</span>
                  <p className="lactation-panel__meta-value">{totalElements}</p>
                </div>
                <div className="lactation-panel__meta-card">
                  <span className="lactation-panel__meta-label">Situação</span>
                  <p className="lactation-panel__meta-value">Aguardando primeira ordenha</p>
                </div>
              </>
            ) : (
              <>
                <div className="lactation-panel__meta-card">
                  <span className="lactation-panel__meta-label">Total desta página</span>
                  <p className="lactation-panel__meta-value">{formatVolume(stats.total)}</p>
                </div>
                <div className="lactation-panel__meta-card">
                  <span className="lactation-panel__meta-label">Média por registro</span>
                  <p className="lactation-panel__meta-value">{formatVolume(stats.average)}</p>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="lactation-panel">
          <div className="lactation-panel__stack">
            <h3 className="lactation-panel__section-title">Próxima ação</h3>
            <div className="lactation-panel__action-group">
              <Button
                variant="primary"
                onClick={openCreate}
                disabled={!canManage}
                title={
                  !canManage ? "Sem permissão para registrar produção." : ""
                }
              >
                <i className="fa-solid fa-plus" aria-hidden="true"></i> Registrar produção
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/lactations`)}
              >
                <i className="fa-solid fa-circle-nodes" aria-hidden="true"></i> Voltar para
                lactações
              </Button>
            </div>
            <p className="lactation-panel__description">
              Ao registrar uma nova ordenha, o histórico é atualizado automaticamente e passa a
              refletir o volume acumulado do período selecionado.
            </p>
          </div>
        </Card>
      </section>

      <Card
        className="milk-filters-card"
        title="Filtrar histórico"
        description="Refine a consulta por período e escolha se deseja incluir registros cancelados."
      >
        <section className="milk-filters">
          <div>
            <label htmlFor="milk-date-from">De</label>
            <input
              id="milk-date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="milk-date-to">Até</label>
            <input
              id="milk-date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
          <label className="milk-toggle" htmlFor="milk-include-canceled">
            <input
              id="milk-include-canceled"
              type="checkbox"
              checked={filters.includeCanceled}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, includeCanceled: e.target.checked }))
              }
            />
            Incluir canceladas
          </label>
          <div className="milk-filter-actions">
            <Button variant="outline" onClick={() => void loadData(0)}>
              <i className="fa-solid fa-filter" aria-hidden="true"></i> Filtrar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setFilters({ dateFrom: "", dateTo: "", includeCanceled: false })}
            >
              Limpar
            </Button>
          </div>
        </section>
      </Card>

      <Card
        className="milk-table-card"
        title="Histórico de produção"
        description={`Registros encontrados nesta busca: ${totalElements}`}
      >
        {productions.length === 0 ? (
          <EmptyState
            title="Nenhuma produção encontrada"
            description={
              filters.includeCanceled
                ? "Não há registros para o período selecionado."
                : "Não há produções ativas para o período selecionado."
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Turno</th>
                <th>Volume</th>
                <th>Status</th>
                <th>Observações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {productions.map((item) => {
                const isCanceled = item.status === "CANCELED";
                const editDisabledTitle = !canManage
                  ? "Sem permissão para editar."
                  : "Registro cancelado não pode ser alterado.";
                const cancelDisabledTitle = !canManage
                  ? "Sem permissão para cancelar."
                  : "Registro cancelado não pode ser alterado.";

                return (
                  <tr key={item.id} className={isCanceled ? "milk-row-canceled" : ""}>
                    <td>{formatDate(item.date)}</td>
                    <td>{shifts.find((s) => s.value === item.shift)?.label || item.shift}</td>
                    <td>{formatVolume(item.volumeLiters)}</td>
                    <td>
                      <div className="milk-status-stack">
                        <span
                          className={`milk-status-badge ${
                            isCanceled ? "milk-status-badge--canceled" : "milk-status-badge--active"
                          }`}
                        >
                          {statusLabels[item.status] || item.status}
                        </span>
                        {item.recordedDuringMilkWithdrawal ? (
                          <span className="milk-status-badge milk-status-badge--withdrawal">
                            Em carencia
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{item.notes || "-"}</td>
                    <td className="milk-actions">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDetail(item)}>
                        Ver detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(item)}
                        disabled={!canManage || isCanceled}
                        title={isCanceled || !canManage ? editDisabledTitle : ""}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void handleCancel(item)}
                        disabled={!canManage || isCanceled}
                        title={isCanceled || !canManage ? cancelDisabledTitle : ""}
                      >
                        Cancelar
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}

        {productions.length > 0 && (
          <div className="milk-pagination">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => {
                const next = Math.max(page - 1, 0);
                setPage(next);
                void loadData(next);
              }}
            >
              Anterior
            </Button>
            <span>
              Página {page + 1} de {Math.max(totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => {
                const next = page + 1;
                setPage(next);
                void loadData(next);
              }}
            >
              Próxima
            </Button>
          </div>
        )}
      </Card>

      <Modal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title={editing ? "Editar produção" : "Nova produção"}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowFormModal(false);
                resetForm();
              }}
            >
              Fechar
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSubmit()}
              disabled={!canManage || isEditingCanceled}
              title={isEditingCanceled ? "Registro cancelado não pode ser alterado." : ""}
            >
              Salvar
            </Button>
          </>
        }
      >
        {submitError && <p className="text-danger">{submitError}</p>}
        {isEditingCanceled && (
          <div className="milk-canceled-banner">Registro cancelado. Edição bloqueada.</div>
        )}
        {!editing && hasCurrentMilkWithdrawal && withdrawalStatus?.milkWithdrawal && (
          <p className="milk-withdrawal-note">
            Esta ordenha será registrada em carência até{" "}
            {formatDate(withdrawalStatus.milkWithdrawal.withdrawalEndDate)} por{" "}
            {withdrawalStatus.milkWithdrawal.productName ||
              withdrawalStatus.milkWithdrawal.title ||
              "tratamento sanitario"}
            . O volume seguirá no histórico, mas não deve ser usado comercialmente.
          </p>
        )}
        <div className="milk-form-grid">
          <div>
            <label htmlFor="milk-form-date">Data</label>
            <input
              id="milk-form-date"
              type="date"
              value={form.date}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, date: e.target.value }));
                setFormErrors((prev) => ({ ...prev, date: undefined }));
              }}
              disabled={!canManage || Boolean(editing)}
              max={getTodayLocalDate()}
            />
            {formErrors.date && <p className="text-danger">{formErrors.date}</p>}
          </div>
          <div>
            <label htmlFor="milk-form-shift">Turno</label>
            <select
              id="milk-form-shift"
              value={form.shift}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, shift: e.target.value as MilkingShift }));
                setFormErrors((prev) => ({ ...prev, shift: undefined }));
              }}
              disabled={!canManage || Boolean(editing)}
            >
              {shifts.map((shift) => (
                <option key={shift.value} value={shift.value}>
                  {shift.label}
                </option>
              ))}
            </select>
            {formErrors.shift && <p className="text-danger">{formErrors.shift}</p>}
          </div>
          <div>
            <label htmlFor="milk-form-volume">Volume (litros)</label>
            <input
              id="milk-form-volume"
              type="number"
              min="0"
              step="0.01"
              value={form.volumeLiters}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, volumeLiters: Number(e.target.value) }));
                setFormErrors((prev) => ({ ...prev, volumeLiters: undefined }));
              }}
              disabled={!canManage || isEditingCanceled}
            />
            {formErrors.volumeLiters && <p className="text-danger">{formErrors.volumeLiters}</p>}
          </div>
          <div className="milk-form-notes">
            <label htmlFor="milk-form-notes">Observações</label>
            <textarea
              id="milk-form-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              disabled={!canManage || isEditingCanceled}
            />
          </div>
        </div>
        {editing && (
          <p className="text-muted milk-edit-note">
            Durante a edição, apenas volume e observações podem ser alterados.
          </p>
        )}
      </Modal>

      <Modal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailError(null);
        }}
        title="Detalhes da produção"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDetailModal(false);
                setDetailError(null);
              }}
            >
              Fechar
            </Button>
            {detail && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false);
                    openEdit(detail);
                  }}
                  disabled={!canManage || detail.status === "CANCELED"}
                  title={
                    !canManage
                      ? "Sem permissão para editar."
                      : detail.status === "CANCELED"
                        ? "Registro cancelado não pode ser alterado."
                        : ""
                  }
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => void handleCancel(detail)}
                  disabled={!canManage || detail.status === "CANCELED"}
                  title={
                    !canManage
                      ? "Sem permissão para cancelar."
                      : detail.status === "CANCELED"
                        ? "Registro cancelado não pode ser alterado."
                        : ""
                  }
                >
                  Cancelar
                </Button>
              </>
            )}
          </>
        }
      >
        {detailLoading && <LoadingState label="Carregando detalhes da produção..." />}
        {!detailLoading && detailError && <p className="text-danger">{detailError}</p>}
        {!detailLoading && !detailError && detail && (
          <>
            {detail.status === "CANCELED" && (
              <div className="milk-canceled-banner">Registro cancelado</div>
            )}
            <div className="milk-detail-grid">
              <div>
                <label>Status</label>
                <p>
                  <span
                    className={`milk-status-badge ${
                      detail.status === "CANCELED"
                        ? "milk-status-badge--canceled"
                        : "milk-status-badge--active"
                    }`}
                  >
                    {statusLabels[detail.status] || detail.status}
                  </span>
                </p>
              </div>
              <div>
                <label>Produzido em carência</label>
                <p>{detail.recordedDuringMilkWithdrawal ? "Sim" : "Não"}</p>
              </div>
              <div>
                <label>Data</label>
                <p>{formatDate(detail.date)}</p>
              </div>
              <div>
                <label>Turno</label>
                <p>{shifts.find((s) => s.value === detail.shift)?.label || detail.shift}</p>
              </div>
              <div>
                <label>Volume</label>
                <p>{formatVolume(detail.volumeLiters)}</p>
              </div>
              <div>
                <label>Cancelado em</label>
                <p>{formatDateTime(detail.canceledAt)}</p>
              </div>
              <div>
                <label>Carência até</label>
                <p>{formatDate(detail.milkWithdrawalEndDate)}</p>
              </div>
              <div className="milk-detail-full">
                <label>Origem sanitária</label>
                <p>{detail.milkWithdrawalSource || "-"}</p>
              </div>
              <div className="milk-detail-full">
                <label>Motivo do cancelamento</label>
                <p>{detail.canceledReason || "-"}</p>
              </div>
              <div className="milk-detail-full">
                <label>Observações</label>
                <p>{detail.notes || "-"}</p>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}


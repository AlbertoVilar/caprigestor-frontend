import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import {
  cancelMilkProduction,
  createMilkProduction,
  getMilkProductionById,
  listMilkProductions,
  patchMilkProduction,
} from "../../api/GoatFarmAPI/milkProduction";
import { usePermissions } from "../../Hooks/usePermissions";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { parseApiError, type ParsedApiError } from "../../utils/apiError";
import { formatLocalDatePtBR, getTodayLocalDate } from "../../utils/localDate";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type {
  MilkProductionRequestDTO,
  MilkProductionResponseDTO,
  MilkProductionStatus,
  MilkProductionUpdateRequestDTO,
  MilkingShift,
} from "../../Models/MilkProductionDTOs";
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
  { value: "MORNING", label: "Manha" },
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
    return "Registro nao encontrado.";
  }

  if (parsed.status === 422 && backendMessage) {
    return backendMessage;
  }

  if (parsed.status === 409 && backendMessage) {
    return backendMessage;
  }

  if (parsed.status === 403) {
    return "Sem permissao para acessar esta fazenda.";
  }

  if (parsed.status === 401) {
    return backendMessage || "Nao autenticado.";
  }

  return backendMessage || "Erro inesperado. Tente novamente.";
};

export default function MilkProductionPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
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

  const stats = useMemo(() => {
    const total = productions.reduce((sum, item) => sum + Number(item.volumeLiters || 0), 0);
    const average = productions.length ? total / productions.length : 0;
    return { total, average };
  }, [productions]);

  const loadData = async (pageOverride = page) => {
    if (!farmId || !goatId || Number.isNaN(farmIdNumber)) return;
    try {
      setLoading(true);
      const [list, goatData] = await Promise.all([
        listMilkProductions(farmIdNumber, goatId, {
          page: pageOverride,
          size: 10,
          sort: ["date,desc", "shift,asc", "id,desc"],
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          includeCanceled: filters.includeCanceled || undefined,
        }),
        fetchGoatById(farmIdNumber, goatId).catch(() => null),
      ]);

      setProductions(list.content || []);
      setTotalPages(list.totalPages || 0);
      setTotalElements(list.totalElements || 0);
      if (goatData) setGoat(goatData);
    } catch (error) {
      console.error("Erro ao carregar producao de leite", error);
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
      console.error("Erro ao carregar detalhes da producao", error);
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
      toast.error("Sem permissao para esta acao.");
      return;
    }
    resetForm();
    setShowFormModal(true);
  };

  const openEdit = (entry: MilkProductionResponseDTO) => {
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
      return;
    }
    if (entry.status === "CANCELED") {
      toast.info("Registro cancelado nao pode ser alterado.");
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
      toast.error("Sem permissao para esta acao.");
      return;
    }
    if (editing && editing.status === "CANCELED") {
      setSubmitError("Registro cancelado nao pode ser alterado.");
      return;
    }

    const errors: typeof formErrors = {};
    if (!editing && !form.date) {
      errors.date = "Informe a data da producao.";
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
        toast.success("Producao atualizada.");
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
        await createMilkProduction(farmIdNumber, goatId, payload);
        toast.success("Producao registrada.");
        setShowFormModal(false);
        resetForm();
        setPage(0);
        await loadData(0);
      }
    } catch (error) {
      console.error("Erro ao salvar producao", error);
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
          console.error("Erro ao atualizar estado da producao apos falha no PATCH", refreshError);
        }
      }
    }
  };

  const handleCancel = async (entry: MilkProductionResponseDTO) => {
    if (!farmId || !goatId || Number.isNaN(farmIdNumber)) return;
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
      return;
    }
    if (entry.status === "CANCELED") {
      toast.info("Registro ja esta cancelado.");
      return;
    }

    const ok = window.confirm(
      "Tem certeza que deseja CANCELAR este registro? Ele nao sera removido, apenas marcado como cancelado."
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
      console.error("Erro ao cancelar producao", error);
      const parsed = parseApiError(error);
      toast.error(getMilkErrorMessage(parsed, "cancel"));
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
      </div>
    );
  }

  return (
    <div className="milk-production-page">
      <section className="milk-hero">
        <div>
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <h2>Producao de leite</h2>
          <p className="text-muted">Fazenda - Cabra - Producao</p>
          <p>
            Animal: <strong>{goat?.name || goatId}</strong> - Registro {goatId}
          </p>
        </div>
        <div className="milk-hero-actions">
          <button
            className="btn-outline"
            onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/lactations`)}
          >
            <i className="fa-solid fa-circle-nodes"></i> Lactacoes
          </button>
          <button
            className="btn-primary"
            onClick={openCreate}
            disabled={!canManage}
            title={!canManage ? "Sem permissao para registrar producao." : ""}
          >
            <i className="fa-solid fa-plus"></i> Registrar producao
          </button>
        </div>
      </section>

      <section className="milk-stats">
        <div className="stat-card">
          <h4>Total na pagina</h4>
          <p>{formatVolume(stats.total)}</p>
        </div>
        <div className="stat-card">
          <h4>Media por registro</h4>
          <p>{formatVolume(stats.average)}</p>
        </div>
        <div className="stat-card">
          <h4>Registros na busca</h4>
          <p>{totalElements}</p>
        </div>
      </section>

      <section className="milk-filters">
        <div>
          <label>De</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
          />
        </div>
        <div>
          <label>Ate</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
          />
        </div>
        <label className="milk-toggle">
          <input
            type="checkbox"
            checked={filters.includeCanceled}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, includeCanceled: e.target.checked }))
            }
          />
          Incluir canceladas
        </label>
        <button className="btn-outline" onClick={() => void loadData(0)}>
          <i className="fa-solid fa-filter"></i> Filtrar
        </button>
        <button
          className="btn-secondary"
          onClick={() => setFilters({ dateFrom: "", dateTo: "", includeCanceled: false })}
        >
          Limpar
        </button>
      </section>

      <section className="milk-table">
        {productions.length === 0 ? (
          <div className="milk-empty">
            {filters.includeCanceled
              ? "Nenhuma producao encontrada para o periodo selecionado."
              : "Nenhuma producao ativa registrada para o periodo selecionado."}
            {canManage && (
              <div className="milk-hero-actions" style={{ marginTop: "1rem" }}>
                <button className="btn-primary" onClick={openCreate}>
                  Registrar producao
                </button>
              </div>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Turno</th>
                <th>Volume</th>
                <th>Status</th>
                <th>Observacoes</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {productions.map((item) => {
                const isCanceled = item.status === "CANCELED";
                const editDisabledTitle = !canManage
                  ? "Sem permissao para editar."
                  : "Registro cancelado nao pode ser alterado.";
                const cancelDisabledTitle = !canManage
                  ? "Sem permissao para cancelar."
                  : "Registro cancelado nao pode ser alterado.";

                return (
                  <tr key={item.id} className={isCanceled ? "milk-row-canceled" : ""}>
                    <td>{formatDate(item.date)}</td>
                    <td>{shifts.find((s) => s.value === item.shift)?.label || item.shift}</td>
                    <td>{formatVolume(item.volumeLiters)}</td>
                    <td>
                      <span
                        className={`milk-status-badge ${
                          isCanceled ? "milk-status-badge--canceled" : "milk-status-badge--active"
                        }`}
                      >
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                    <td>{item.notes || "-"}</td>
                    <td className="milk-actions">
                      <button className="btn-outline" onClick={() => handleOpenDetail(item)}>
                        Ver detalhes
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => openEdit(item)}
                        disabled={!canManage || isCanceled}
                        title={isCanceled || !canManage ? editDisabledTitle : ""}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => void handleCancel(item)}
                        disabled={!canManage || isCanceled}
                        title={isCanceled || !canManage ? cancelDisabledTitle : ""}
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="milk-pagination">
          <button
            className="btn-outline"
            disabled={page <= 0}
            onClick={() => {
              const next = Math.max(page - 1, 0);
              setPage(next);
              void loadData(next);
            }}
          >
            Anterior
          </button>
          <span>
            Pagina {page + 1} de {Math.max(totalPages, 1)}
          </span>
          <button
            className="btn-outline"
            disabled={page + 1 >= totalPages}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              void loadData(next);
            }}
          >
            Proxima
          </button>
        </div>
      </section>

      {showFormModal && (
        <div className="milk-modal">
          <div className="milk-modal-content">
            <h3>{editing ? "Editar producao" : "Nova producao"}</h3>
            {submitError && <p className="text-danger">{submitError}</p>}
            {isEditingCanceled && (
              <div className="milk-canceled-banner">
                Registro cancelado. Edicao bloqueada.
              </div>
            )}
            <div className="milk-form-grid">
              <div>
                <label>Data</label>
                <input
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
                <label>Turno</label>
                <select
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
                <label>Volume (litros)</label>
                <input
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
                {formErrors.volumeLiters && (
                  <p className="text-danger">{formErrors.volumeLiters}</p>
                )}
              </div>
              <div className="milk-form-notes">
                <label>Observacoes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  disabled={!canManage || isEditingCanceled}
                />
              </div>
            </div>
            {editing && (
              <p className="text-muted milk-edit-note">
                Em edicao, apenas volume e observacoes podem ser alterados.
              </p>
            )}
            <div className="milk-modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
              >
                Fechar
              </button>
              <button
                className="btn-primary"
                onClick={() => void handleSubmit()}
                disabled={!canManage || isEditingCanceled}
                title={isEditingCanceled ? "Registro cancelado nao pode ser alterado." : ""}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && (
        <div className="milk-modal">
          <div className="milk-modal-content milk-detail-modal">
            <h3>Detalhes da producao</h3>
            {detailLoading && (
              <div className="milk-loading-inline">
                <i className="fa-solid fa-spinner fa-spin"></i> Carregando detalhes...
              </div>
            )}
            {!detailLoading && detailError && <p className="text-danger">{detailError}</p>}
            {!detailLoading && !detailError && detail && (
              <>
                {detail.status === "CANCELED" && (
                  <div className="milk-canceled-banner">Registro cancelado</div>
                )}
                <div className="milk-detail-grid">
                  <div>
                    <label>ID</label>
                    <p>{detail.id}</p>
                  </div>
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
                  <div className="milk-detail-full">
                    <label>Motivo do cancelamento</label>
                    <p>{detail.canceledReason || "-"}</p>
                  </div>
                  <div className="milk-detail-full">
                    <label>Observacoes</label>
                    <p>{detail.notes || "-"}</p>
                  </div>
                </div>
                <div className="milk-modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowDetailModal(false);
                      setDetailError(null);
                    }}
                  >
                    Fechar
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => {
                      setShowDetailModal(false);
                      openEdit(detail);
                    }}
                    disabled={!canManage || detail.status === "CANCELED"}
                    title={
                      !canManage
                        ? "Sem permissao para editar."
                        : detail.status === "CANCELED"
                          ? "Registro cancelado nao pode ser alterado."
                          : ""
                    }
                  >
                    Editar
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => void handleCancel(detail)}
                    disabled={!canManage || detail.status === "CANCELED"}
                    title={
                      !canManage
                        ? "Sem permissao para cancelar."
                        : detail.status === "CANCELED"
                          ? "Registro cancelado nao pode ser alterado."
                          : ""
                    }
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

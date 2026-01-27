import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchGoatByFarmAndRegistration } from "../../api/GoatAPI/goat";
import {
  createMilkProduction,
  deleteMilkProduction,
  getMilkProductions,
  updateMilkProduction,
} from "../../api/GoatFarmAPI/milkProduction";
import { usePermissions } from "../../Hooks/usePermissions";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type {
  MilkProductionRequestDTO,
  MilkProductionResponseDTO,
  MilkProductionUpdateRequestDTO,
  MilkingShift,
} from "../../Models/MilkProductionDTOs";
import "./milkProductionPage.css";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString();
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

export default function MilkProductionPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [productions, setProductions] = useState<MilkProductionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({ from: "", to: "" });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MilkProductionResponseDTO | null>(null);
  const [form, setForm] = useState<MilkProductionRequestDTO>({
    date: "",
    shift: "TOTAL_DAY",
    volumeLiters: 0,
    notes: "",
  });

  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const { canCreateGoat } = useFarmPermissions(farmIdNumber);
  const canManage = permissions.isAdmin() || canCreateGoat;

  const stats = useMemo(() => {
    const total = productions.reduce((sum, item) => sum + Number(item.volumeLiters || 0), 0);
    const average = productions.length ? total / productions.length : 0;
    return { total, average };
  }, [productions]);

  const loadData = async (pageOverride = page) => {
    if (!farmId || !goatId) return;
    try {
      setLoading(true);
      const list = await getMilkProductions(farmIdNumber, goatId, {
        page: pageOverride,
        size: 10,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });
      setProductions(list.content || []);
      setTotalPages(list.totalPages || 0);

      try {
        const goatData = await fetchGoatByFarmAndRegistration(farmIdNumber, goatId);
        setGoat(goatData);
      } catch (goatError) {
        console.warn("Falha ao carregar dados da cabra. Mantendo lista de producoes.", goatError);
      }
    } catch (error) {
      console.error("Erro ao carregar produção de leite", error);
      toast.error("Erro ao carregar produção de leite");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, goatId, filters.from, filters.to]);

  const resetForm = () => {
    setForm({ date: "", shift: "TOTAL_DAY", volumeLiters: 0, notes: "" });
    setEditing(null);
  };

  const openCreate = () => {
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
      return;
    }
    resetForm();
    setShowModal(true);
  };

  const openEdit = (entry: MilkProductionResponseDTO) => {
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
      return;
    }
    setEditing(entry);
    setForm({
      date: entry.date,
      shift: entry.shift,
      volumeLiters: Number(entry.volumeLiters || 0),
      notes: entry.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!farmId || !goatId) return;
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
      return;
    }

    if (!form.date) {
      toast.warning("Informe a data da produção");
      return;
    }
    if (!form.shift) {
      toast.warning("Selecione o turno da ordenha");
      return;
    }
    if (!form.volumeLiters || Number(form.volumeLiters) <= 0) {
      toast.warning("Informe o volume produzido");
      return;
    }

    try {
      if (editing) {
        const payload: MilkProductionUpdateRequestDTO = {
          volumeLiters: Number(form.volumeLiters),
          notes: form.notes || undefined,
        };
        await updateMilkProduction(farmIdNumber, goatId, editing.id, payload);
        toast.success("Produção atualizada");
      } else {
        const payload: MilkProductionRequestDTO = {
          date: form.date,
          shift: form.shift,
          volumeLiters: Number(form.volumeLiters),
          notes: form.notes || undefined,
        };
        await createMilkProduction(farmIdNumber, goatId, payload);
        toast.success("Produção registrada");
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Erro ao salvar produção", error);
      toast.error("Erro ao salvar produção");
    }
  };

  const handleDelete = async (entry: MilkProductionResponseDTO) => {
    if (!farmId || !goatId) return;
    if (!canManage) {
      toast.error("Sem permissao para esta acao.");
      return;
    }
    const ok = window.confirm("Deseja realmente excluir este registro?");
    if (!ok) return;
    try {
      await deleteMilkProduction(farmIdNumber, goatId, entry.id);
      toast.success("Registro removido");
      loadData();
    } catch (error) {
      console.error("Erro ao excluir produção", error);
      toast.error("Erro ao excluir produção");
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
          <h2>Produção de leite</h2>
          <p>
            Animal: <strong>{goat?.name || goatId}</strong> · Registro {goatId}
          </p>
        </div>
        <div className="milk-hero-actions">
          <button className="btn-outline" onClick={() => navigate(`/app/goatfarms/${farmId}/goats/${goatId}/lactations`)}>
            <i className="fa-solid fa-circle-nodes"></i> Lactações
          </button>
          <button
            className="btn-primary"
            onClick={openCreate}
            disabled={!canManage}
            title={!canManage ? "Sem permissao para registrar producao" : ""}
          >
            <i className="fa-solid fa-plus"></i> Registrar produção
          </button>
        </div>
      </section>

      <section className="milk-stats">
        <div className="stat-card">
          <h4>Total na página</h4>
          <p>{formatVolume(stats.total)}</p>
        </div>
        <div className="stat-card">
          <h4>Média por registro</h4>
          <p>{formatVolume(stats.average)}</p>
        </div>
        <div className="stat-card">
          <h4>Registros</h4>
          <p>{productions.length}</p>
        </div>
      </section>

      <section className="milk-filters">
        <div>
          <label>De</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
          />
        </div>
        <div>
          <label>Até</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>
        <button className="btn-outline" onClick={() => loadData(0)}>
          <i className="fa-solid fa-filter"></i> Filtrar
        </button>
        <button
          className="btn-secondary"
          onClick={() => setFilters({ from: "", to: "" })}
        >
          Limpar
        </button>
      </section>

      <section className="milk-table">
        {productions.length === 0 ? (
          <div className="milk-empty">
            Nenhuma produção registrada para o período selecionado.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Turno</th>
                <th>Volume</th>
                <th>Observações</th>
                {canManage && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {productions.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.date)}</td>
                  <td>{shifts.find((s) => s.value === item.shift)?.label || item.shift}</td>
                  <td>{formatVolume(item.volumeLiters)}</td>
                  <td>{item.notes || "-"}</td>
                  {canManage && (
                    <td className="milk-actions">
                      <button className="btn-outline" onClick={() => openEdit(item)}>
                        Editar
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(item)}>
                        Excluir
                      </button>
                    </td>
                  )}
                </tr>
              ))}
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
              loadData(next);
            }}
          >
            Anterior
          </button>
          <span>
            Página {page + 1} de {Math.max(totalPages, 1)}
          </span>
          <button
            className="btn-outline"
            disabled={page + 1 >= totalPages}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              loadData(next);
            }}
          >
            Próxima
          </button>
        </div>
      </section>

      {showModal && (
        <div className="milk-modal">
          <div className="milk-modal-content">
            <h3>{editing ? "Editar produção" : "Nova produção"}</h3>
            <div className="milk-form-grid">
              <div>
                <label>Data</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  disabled={!canManage || Boolean(editing)}
                />
              </div>
              <div>
                <label>Turno</label>
                <select
                  value={form.shift}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, shift: e.target.value as MilkingShift }))
                  }
                  disabled={!canManage || Boolean(editing)}
                >
                  {shifts.map((shift) => (
                    <option key={shift.value} value={shift.value}>
                      {shift.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Volume (litros)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.volumeLiters}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, volumeLiters: Number(e.target.value) }))
                  }
                  disabled={!canManage}
                />
              </div>
              <div className="milk-form-notes">
                <label>Observações</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  disabled={!canManage}
                />
              </div>
            </div>
            <div className="milk-modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSubmit} disabled={!canManage}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

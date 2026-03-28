import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  createOperationalExpense,
  listOperationalExpenses,
} from "../../api/CommercialAPI/commercial";
import type {
  OperationalExpenseCategory,
  OperationalExpenseRequestDTO,
  OperationalExpenseResponseDTO,
} from "../../Models/CommercialDTOs";
import { formatCommercialCurrency, formatCommercialDate } from "../../Pages/commercial/commercial.helpers";
import { formatOperationalExpenseCategoryLabel } from "./operationalFinance.helpers";

type OperationalExpenseSectionProps = {
  farmId: number;
  onChanged?: () => void;
};

const today = new Date().toISOString().slice(0, 10);

const defaultForm: OperationalExpenseRequestDTO = {
  category: "OTHER",
  description: "",
  amount: 0,
  expenseDate: today,
  notes: "",
};

const categoryOptions: OperationalExpenseCategory[] = [
  "ENERGY",
  "WATER",
  "FREIGHT",
  "MAINTENANCE",
  "VETERINARY",
  "FUEL",
  "LABOR",
  "FEES",
  "OTHER",
];

export default function OperationalExpenseSection({
  farmId,
  onChanged,
}: OperationalExpenseSectionProps) {
  const [expenses, setExpenses] = useState<OperationalExpenseResponseDTO[]>([]);
  const [form, setForm] = useState<OperationalExpenseRequestDTO>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadExpenses() {
      setLoading(true);
      setError("");

      try {
        const result = await listOperationalExpenses(farmId);
        if (!active) return;
        setExpenses(result);
      } catch (loadError) {
        console.error("Financeiro operacional: erro ao carregar despesas", loadError);
        if (!active) return;
        setError("Nao foi possivel carregar as despesas operacionais.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadExpenses();

    return () => {
      active = false;
    };
  }, [farmId]);

  async function refreshExpenses() {
    const result = await listOperationalExpenses(farmId);
    setExpenses(result);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      await createOperationalExpense(farmId, {
        ...form,
        description: form.description.trim(),
        notes: form.notes?.trim() || undefined,
      });
      toast.success("Despesa operacional registrada com sucesso.");
      setForm({ ...defaultForm, expenseDate: today });
      await refreshExpenses();
      onChanged?.();
    } catch (submitError) {
      console.error("Financeiro operacional: erro ao registrar despesa", submitError);
      toast.error("Nao foi possivel registrar a despesa operacional.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="commercial-card">
      <div className="commercial-card__header">
        <div>
          <p className="commercial-card__eyebrow">Saidas operacionais</p>
          <h2>Despesas da fazenda</h2>
        </div>
        <span className="commercial-card__chip">{expenses.length} registro(s)</span>
      </div>

      <form className="commercial-form" onSubmit={handleSubmit}>
        <label>
          <span>Categoria</span>
          <select
            value={form.category}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                category: event.target.value as OperationalExpenseCategory,
              }))
            }
            required
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {formatOperationalExpenseCategoryLabel(category)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Data da despesa</span>
          <input
            type="date"
            value={form.expenseDate}
            onChange={(event) => setForm((prev) => ({ ...prev, expenseDate: event.target.value }))}
            required
          />
        </label>

        <label className="commercial-form__full">
          <span>Descricao</span>
          <input
            type="text"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            maxLength={200}
            required
          />
        </label>

        <label>
          <span>Valor</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount || ""}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
            required
          />
        </label>

        <label className="commercial-form__full">
          <span>Observacoes</span>
          <textarea
            rows={3}
            value={form.notes || ""}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </label>

        <button type="submit" className="commercial-btn commercial-btn--primary" disabled={submitting}>
          {submitting ? "Salvando..." : "Registrar despesa"}
        </button>
      </form>

      {loading ? <div className="commercial-feedback">Carregando despesas...</div> : null}
      {error ? <div className="commercial-feedback commercial-feedback--error">{error}</div> : null}

      {!loading && !error ? (
        <div className="commercial-table-shell">
          <table className="commercial-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Categoria</th>
                <th>Descricao</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{formatCommercialDate(expense.expenseDate)}</td>
                  <td>{formatOperationalExpenseCategoryLabel(expense.category)}</td>
                  <td>
                    <strong>{expense.description}</strong>
                    <small>{expense.notes || "-"}</small>
                  </td>
                  <td>{formatCommercialCurrency(expense.amount)}</td>
                </tr>
              ))}
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4}>Nenhuma despesa operacional registrada ainda.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

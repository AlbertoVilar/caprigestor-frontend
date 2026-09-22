import React from "react";
import type {
  CustomerResponseDTO,
  MilkSaleRequestDTO,
  MilkSaleResponseDTO,
} from "../../Models/CommercialDTOs";
import {
  formatCommercialCurrency,
  formatCommercialDate,
  formatCommercialNumber,
  formatPaymentStatusLabel,
} from "../../Pages/commercial/commercial.helpers";

export type MilkSalesTabProps = {
  activeCustomers: CustomerResponseDTO[];
  milkSales: MilkSaleResponseDTO[];
  milkSaleForm: MilkSaleRequestDTO;
  setMilkSaleForm: React.Dispatch<React.SetStateAction<MilkSaleRequestDTO>>;
  handleCreateMilkSale: (event: React.FormEvent<HTMLFormElement>) => void;
  exportMilkSalesCsv: () => void;
  submitting: "customer" | "animalSale" | "milkSale" | null;
  milkSaleTotalPreview: string;
  today: string;
};

export default function MilkSalesTab({
  activeCustomers,
  milkSales,
  milkSaleForm,
  setMilkSaleForm,
  handleCreateMilkSale,
  exportMilkSalesCsv,
  submitting,
  milkSaleTotalPreview,
  today,
}: MilkSalesTabProps) {
  return (
    <div className="commercial-milk-tab">
      <section className="commercial-grid commercial-grid--tables">
        <article className="commercial-card">
          <div className="commercial-card__header">
            <div>
              <p className="commercial-card__eyebrow">Comercialização recorrente</p>
              <h2>Venda de leite</h2>
            </div>
            <span className="commercial-card__chip">{milkSaleTotalPreview}</span>
          </div>
          <p className="commercial-muted">
            Registro de vendas de leite a granel ou laticínios para clientes cadastrados.
          </p>
          <form className="commercial-form" onSubmit={handleCreateMilkSale}>
            <label>
              <span>Cliente</span>
              <select
                value={milkSaleForm.customerId || ""}
                onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, customerId: Number(event.target.value) }))}
                required
                disabled={activeCustomers.length === 0}
              >
                {activeCustomers.length === 0 ? <option value="">Cadastre um cliente primeiro</option> : null}
                {activeCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Data da venda</span>
              <input
                type="date"
                value={milkSaleForm.saleDate}
                onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, saleDate: event.target.value }))}
                max={today}
                required
              />
            </label>
            <label>
              <span>Quantidade (L)</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={milkSaleForm.quantityLiters || ""}
                onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, quantityLiters: Number(event.target.value) }))}
                required
              />
            </label>
            <label>
              <span>Preço unitário</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={milkSaleForm.unitPrice || ""}
                onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, unitPrice: Number(event.target.value) }))}
                required
              />
            </label>
            <label>
              <span>Vencimento</span>
              <input
                type="date"
                value={milkSaleForm.dueDate}
                onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Pagamento imediato</span>
              <input
                type="date"
                value={milkSaleForm.paymentDate || ""}
                onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, paymentDate: event.target.value }))}
                max={today}
              />
            </label>
            <label className="commercial-form__full">
              <span>Observações</span>
              <textarea
                rows={3}
                value={milkSaleForm.notes || ""}
                onChange={(event) => setMilkSaleForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </label>
            <button
              type="submit"
              className="commercial-btn commercial-btn--primary"
              disabled={submitting === "milkSale" || activeCustomers.length === 0}
            >
              {submitting === "milkSale" ? "Salvando..." : "Registrar venda de leite"}
            </button>
          </form>
        </article>

        <article className="commercial-card">
          <div className="commercial-card__header">
            <div>
              <p className="commercial-card__eyebrow">Histórico comercial</p>
              <h2>Vendas de leite</h2>
            </div>
            <div className="commercial-card__actions">
              <span className="commercial-card__chip">{milkSales.length}</span>
              <button
                type="button"
                className="commercial-btn commercial-btn--secondary"
                onClick={exportMilkSalesCsv}
                disabled={milkSales.length === 0}
              >
                Exportar CSV
              </button>
            </div>
          </div>
          <div className="commercial-table-shell">
            <table className="commercial-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Venda</th>
                  <th>Total</th>
                  <th>Recebimento</th>
                </tr>
              </thead>
              <tbody>
                {milkSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.customerName}</td>
                    <td>
                      <span>{formatCommercialDate(sale.saleDate)}</span>
                      <small>{formatCommercialNumber(sale.quantityLiters)} L</small>
                    </td>
                    <td>
                      <span>{formatCommercialCurrency(sale.totalAmount)}</span>
                      <small>{formatCommercialCurrency(sale.unitPrice)} / L</small>
                    </td>
                    <td>
                      <span>{formatPaymentStatusLabel(sale.paymentStatus)}</span>
                      <small>{formatCommercialDate(sale.paymentDate)}</small>
                    </td>
                  </tr>
                ))}
                {milkSales.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Nenhuma venda de leite registrada ainda.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}

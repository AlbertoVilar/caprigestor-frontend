import React from "react";
import OwnershipSaleSection from "./OwnershipSaleSection";
import type {
  AnimalSaleRequestDTO,
  AnimalSaleResponseDTO,
  CustomerResponseDTO,
} from "../../Models/CommercialDTOs";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import {
  formatCommercialCurrency,
  formatCommercialDate,
  formatPaymentStatusLabel,
} from "../../Pages/commercial/commercial.helpers";

export type AnimalSalesTabProps = {
  farmId: number;
  goats: GoatResponseDTO[];
  customers: CustomerResponseDTO[];
  activeCustomers: CustomerResponseDTO[];
  animalSales: AnimalSaleResponseDTO[];
  animalSaleForm: AnimalSaleRequestDTO;
  setAnimalSaleForm: React.Dispatch<React.SetStateAction<AnimalSaleRequestDTO>>;
  handleCreateAnimalSale: (event: React.FormEvent<HTMLFormElement>) => void;
  exportAnimalSalesCsv: () => void;
  submitting: "customer" | "animalSale" | "milkSale" | null;
  animalSaleTotalPreview: string;
  canAdministerFarm: boolean;
  onOwnershipSaleChanged: () => void;
  today: string;
};

export default function AnimalSalesTab({
  farmId,
  goats,
  customers,
  activeCustomers,
  animalSales,
  animalSaleForm,
  setAnimalSaleForm,
  handleCreateAnimalSale,
  exportAnimalSalesCsv,
  submitting,
  animalSaleTotalPreview,
  canAdministerFarm,
  onOwnershipSaleChanged,
  today,
}: AnimalSalesTabProps) {
  return (
    <div className="commercial-animals-tab">
      <section className="commercial-card commercial-model-info-banner">
        <p className="commercial-card__eyebrow">Modelos de comercialização de animais</p>
        <p className="commercial-muted">
          O CapriGestor opera com dois modelos distintos de comercialização de caprinos:
          a <strong>venda para cliente externo</strong> (o animal sai do rebanho/ecossistema do sistema)
          e a <strong>venda entre fazendas do CapriGestor</strong> (o animal mantém seu histórico e identificador GoatId estável,
          sendo transferido patrimonialmente após confirmação de pagamento pelo vendedor).
        </p>
      </section>

      {/* MODELO A: VENDA PARA CLIENTE EXTERNO */}
      <section className="commercial-grid commercial-grid--tables">
        <article className="commercial-card">
          <div className="commercial-card__header">
            <div>
              <p className="commercial-card__eyebrow">Venda para cliente externo</p>
              <h2>Registrar venda externa</h2>
            </div>
            <span className="commercial-card__chip">{animalSaleTotalPreview}</span>
          </div>
          <p className="commercial-muted">
            O animal sai do rebanho e do ecossistema de titularidade do CapriGestor para um cliente externo comprador.
          </p>
          <form className="commercial-form" onSubmit={handleCreateAnimalSale}>
            <label className="commercial-form__full">
              <span>Animal</span>
              <select
                value={animalSaleForm.goatId}
                onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, goatId: event.target.value }))}
                required
              >
                <option value="">Selecione</option>
                {goats.map((goat) => (
                  <option key={goat.registrationNumber} value={goat.registrationNumber}>
                    {goat.registrationNumber} · {goat.name} · {goat.status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Cliente comprador</span>
              <select
                value={animalSaleForm.customerId || ""}
                onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, customerId: Number(event.target.value) }))}
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
                value={animalSaleForm.saleDate}
                onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, saleDate: event.target.value }))}
                max={today}
                required
              />
            </label>
            <label>
              <span>Valor</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={animalSaleForm.amount || ""}
                onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
                required
              />
            </label>
            <label>
              <span>Vencimento</span>
              <input
                type="date"
                value={animalSaleForm.dueDate}
                onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Pagamento imediato</span>
              <input
                type="date"
                value={animalSaleForm.paymentDate || ""}
                onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, paymentDate: event.target.value }))}
                max={today}
              />
            </label>
            <label className="commercial-form__full">
              <span>Observações</span>
              <textarea
                rows={3}
                value={animalSaleForm.notes || ""}
                onChange={(event) => setAnimalSaleForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </label>
            <button
              type="submit"
              className="commercial-btn commercial-btn--primary"
              disabled={submitting === "animalSale" || activeCustomers.length === 0}
            >
              {submitting === "animalSale" ? "Salvando..." : "Registrar venda do animal"}
            </button>
          </form>
        </article>

        <article className="commercial-card">
          <div className="commercial-card__header">
            <div>
              <p className="commercial-card__eyebrow">Histórico comercial</p>
              <h2>Vendas de animais (clientes externos)</h2>
            </div>
            <div className="commercial-card__actions">
              <span className="commercial-card__chip">{animalSales.length}</span>
              <button
                type="button"
                className="commercial-btn commercial-btn--secondary"
                onClick={exportAnimalSalesCsv}
                disabled={animalSales.length === 0}
              >
                Exportar CSV
              </button>
            </div>
          </div>
          <div className="commercial-table-shell">
            <table className="commercial-table">
              <thead>
                <tr>
                  <th>Animal</th>
                  <th>Cliente</th>
                  <th>Venda</th>
                  <th>Recebimento</th>
                  <th>Reversão</th>
                </tr>
              </thead>
              <tbody>
                {animalSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <strong>{sale.goatRegistrationNumber}</strong>
                      <small>{sale.goatName}</small>
                    </td>
                    <td>{sale.customerName || "-"}</td>
                    <td>
                      <span>{formatCommercialDate(sale.saleDate)}</span>
                      <small>{formatCommercialCurrency(sale.amount)}</small>
                    </td>
                    <td>
                      <span>{sale.reversed ? "Revertida" : formatPaymentStatusLabel(sale.paymentStatus)}</span>
                      <small>{formatCommercialDate(sale.paymentDate)}</small>
                    </td>
                    <td>
                      {sale.reversed ? (
                        <>
                          <strong>Sim</strong>
                          <small>{sale.reversalReason || "Motivo não informado"}</small>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
                {animalSales.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Nenhuma venda de animal registrada ainda.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {/* MODELO B: VENDA ENTRE FAZENDAS DO CAPRIGESTOR (INTERNAL_SALE) */}
      <div className="commercial-internal-sales-group">
        <OwnershipSaleSection
          farmId={farmId}
          goats={goats}
          customers={customers}
          canAdministerFarm={canAdministerFarm}
          onChanged={onOwnershipSaleChanged}
        />
      </div>
    </div>
  );
}

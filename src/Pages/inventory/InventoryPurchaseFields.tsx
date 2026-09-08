import type { ReactNode } from "react";
import {
  calculatePurchaseCost,
  formatCents,
  type InventoryFormState,
} from "./inventoryPageState";

type PurchaseFieldKey =
  | "unitCost"
  | "freightCost"
  | "discountAmount"
  | "purchaseDate"
  | "supplierName";

type InventoryPurchaseFieldsProps = {
  form: InventoryFormState;
  disabled: boolean;
  onPurchaseToggle: (checked: boolean) => void;
  onChange: (field: PurchaseFieldKey, value: string) => void;
  renderFieldFeedback: (fieldName: string) => ReactNode;
};

export default function InventoryPurchaseFields({
  form,
  disabled,
  onPurchaseToggle,
  onChange,
  renderFieldFeedback,
}: InventoryPurchaseFieldsProps) {
  if (form.type !== "IN") {
    return null;
  }

  const calculation = calculatePurchaseCost(
    form.quantity,
    form.unitCost,
    form.freightCost,
    form.discountAmount
  );

  return (
    <>
      <div className="col-12">
        <div className="form-check form-switch border rounded-3 p-3 ps-5 bg-light">
          <input
            id="inventory-is-purchase"
            className="form-check-input"
            type="checkbox"
            role="switch"
            checked={form.isPurchase}
            onChange={(event) => onPurchaseToggle(event.target.checked)}
            disabled={disabled}
          />
          <label className="form-check-label fw-semibold" htmlFor="inventory-is-purchase">
            Esta entrada é uma compra de estoque
          </label>
          <div className="small text-muted mt-1">
            Ative para registrar fornecedor, frete, desconto e custo da aquisição.
          </div>
        </div>
      </div>

      {form.isPurchase && (
        <>

      <div className="col-12 col-md-6">
        <label className="form-label" htmlFor="inventory-unit-cost">Custo unitário</label>
        <input
          id="inventory-unit-cost"
          className={`form-control ${renderFieldFeedback("unitCost") ? "is-invalid" : ""}`}
          type="number"
          min="0.0001"
          step="0.0001"
          value={form.unitCost}
          onChange={(event) => onChange("unitCost", event.target.value)}
          disabled={disabled}
          placeholder="Ex.: 18,5000"
        />
        {renderFieldFeedback("unitCost")}
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label" htmlFor="inventory-freight-cost">Frete</label>
        <input
          id="inventory-freight-cost"
          className={`form-control ${renderFieldFeedback("freightCost") ? "is-invalid" : ""}`}
          type="number"
          min="0"
          step="0.01"
          value={form.freightCost}
          onChange={(event) => onChange("freightCost", event.target.value)}
          disabled={disabled}
          placeholder="Ex.: 25,00"
        />
        {renderFieldFeedback("freightCost")}
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label" htmlFor="inventory-discount-amount">Desconto</label>
        <input
          id="inventory-discount-amount"
          className={`form-control ${renderFieldFeedback("discountAmount") ? "is-invalid" : ""}`}
          type="number"
          min="0"
          step="0.01"
          value={form.discountAmount}
          onChange={(event) => onChange("discountAmount", event.target.value)}
          disabled={disabled}
          placeholder="Ex.: 10,00"
        />
        {renderFieldFeedback("discountAmount")}
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label" htmlFor="inventory-purchase-date">Data da compra</label>
        <input
          id="inventory-purchase-date"
          className={`form-control ${renderFieldFeedback("purchaseDate") ? "is-invalid" : ""}`}
          type="date"
          value={form.purchaseDate}
          onChange={(event) => onChange("purchaseDate", event.target.value)}
          disabled={disabled}
        />
        {renderFieldFeedback("purchaseDate")}
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label" htmlFor="inventory-supplier-name">Fornecedor</label>
        <input
          id="inventory-supplier-name"
          className={`form-control ${renderFieldFeedback("supplierName") ? "is-invalid" : ""}`}
          type="text"
          maxLength={120}
          value={form.supplierName}
          onChange={(event) => onChange("supplierName", event.target.value)}
          disabled={disabled}
          placeholder="Ex.: Casa do Campo"
        />
        {renderFieldFeedback("supplierName")}
      </div>

      <div className="col-12">
        <div className="border rounded-3 bg-light p-3" aria-live="polite">
          <div className="d-flex justify-content-between gap-3 flex-wrap">
            <span>Subtotal dos produtos</span>
            <strong>{calculation ? formatCents(calculation.subtotalCents) : "—"}</strong>
          </div>
          <div className="d-flex justify-content-between gap-3 flex-wrap mt-2 pt-2 border-top">
            <span className="fw-semibold">Custo total</span>
            <strong className={calculation && calculation.totalCents <= 0n ? "text-danger" : "text-success"}>
              {calculation ? formatCents(calculation.totalCents) : "—"}
            </strong>
          </div>
          <div className="small text-muted mt-2">
            Calculado automaticamente: subtotal + frete − desconto.
          </div>
        </div>
      </div>
        </>
      )}
    </>
  );
}

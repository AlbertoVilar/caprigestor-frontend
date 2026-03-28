import type { ReactNode } from "react";
import type { InventoryFormState } from "./inventoryPageState";

type PurchaseFieldKey = "unitCost" | "totalCost" | "purchaseDate" | "supplierName";

type InventoryPurchaseFieldsProps = {
  form: InventoryFormState;
  disabled: boolean;
  onChange: (field: PurchaseFieldKey, value: string) => void;
  renderFieldFeedback: (fieldName: string) => ReactNode;
};

export default function InventoryPurchaseFields({
  form,
  disabled,
  onChange,
  renderFieldFeedback,
}: InventoryPurchaseFieldsProps) {
  if (form.type !== "IN") {
    return null;
  }

  return (
    <>
      <div className="col-12">
        <div className="alert alert-light border mb-0" role="note">
          Preencha os dados de compra apenas quando esta entrada representar aquisicao de estoque.
        </div>
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label" htmlFor="inventory-unit-cost">Custo unitario</label>
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
        <label className="form-label" htmlFor="inventory-total-cost">Custo total</label>
        <input
          id="inventory-total-cost"
          className={`form-control ${renderFieldFeedback("totalCost") ? "is-invalid" : ""}`}
          type="number"
          min="0.01"
          step="0.01"
          value={form.totalCost}
          onChange={(event) => onChange("totalCost", event.target.value)}
          disabled={disabled}
          placeholder="Ex.: 185,00"
        />
        {renderFieldFeedback("totalCost")}
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
    </>
  );
}

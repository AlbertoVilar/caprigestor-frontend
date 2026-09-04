import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import InventoryPurchaseFields from "./InventoryPurchaseFields";
import { buildInitialForm } from "./inventoryPageState";

describe("InventoryPurchaseFields", () => {
  it("exibe os valores calculados e mantem o total somente leitura", () => {
    const html = renderToStaticMarkup(
      <InventoryPurchaseFields
        form={{
          ...buildInitialForm(),
          type: "IN",
          quantity: "32.143",
          isPurchase: true,
          unitCost: "112",
          freightCost: "45.50",
          discountAmount: "12.25",
          purchaseDate: "2026-08-01",
        }}
        disabled={false}
        onPurchaseToggle={vi.fn()}
        onChange={vi.fn()}
        renderFieldFeedback={() => null}
      />
    );

    expect(html).toContain("R$ 3.600,02");
    expect(html).toContain("R$ 3.633,27");
    expect(html).not.toContain("inventory-total-cost");
  });

  it("solicita confirmacao explicita antes de mostrar os dados financeiros", () => {
    const html = renderToStaticMarkup(
      <InventoryPurchaseFields
        form={{ ...buildInitialForm(), type: "IN" }}
        disabled={false}
        onPurchaseToggle={vi.fn()}
        onChange={vi.fn()}
        renderFieldFeedback={() => null}
      />
    );

    expect(html).toContain("Esta entrada é uma compra de estoque");
    expect(html).not.toContain("inventory-unit-cost");
  });
});

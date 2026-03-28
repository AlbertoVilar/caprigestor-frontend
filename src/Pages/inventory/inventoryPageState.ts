import type {
  InventoryAdjustDirection,
  InventoryItemCreateRequest,
  InventoryLotCreateRequest,
  InventoryMovementCreateRequestDTO,
  InventoryMovementType,
} from "../../Models/InventoryDTOs";

export type InventoryFormState = {
  type: InventoryMovementType;
  quantity: string;
  lotId: string;
  adjustDirection: InventoryAdjustDirection | "";
  movementDate: string;
  reason: string;
  unitCost: string;
  totalCost: string;
  purchaseDate: string;
  supplierName: string;
};

export type InventoryItemFormState = {
  name: string;
  trackLot: boolean;
};

export type InventoryLotFormState = {
  code: string;
  description: string;
  expirationDate: string;
  active: boolean;
};

export type BuildPayloadResult = {
  payload?: InventoryMovementCreateRequestDTO;
  error?: string;
};

export const INVENTORY_TECHNICAL_DETAILS_DEFAULT_OPEN = false;

export const buildInitialForm = (): InventoryFormState => ({
  type: "OUT",
  quantity: "",
  lotId: "",
  adjustDirection: "",
  movementDate: new Date().toISOString().slice(0, 10),
  reason: "",
  unitCost: "",
  totalCost: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  supplierName: "",
});

export const buildInitialItemForm = (): InventoryItemFormState => ({
  name: "",
  trackLot: false,
});

export const buildInitialLotForm = (): InventoryLotFormState => ({
  code: "",
  description: "",
  expirationDate: "",
  active: true,
});

export const mapPayloadToForm = (
  payload: InventoryMovementCreateRequestDTO
): InventoryFormState => ({
  type: payload.type,
  quantity: `${payload.quantity}`,
  lotId: payload.lotId != null ? `${payload.lotId}` : "",
  adjustDirection: payload.type === "ADJUST" ? payload.adjustDirection ?? "" : "",
  movementDate: payload.movementDate ?? new Date().toISOString().slice(0, 10),
  reason: payload.reason ?? "",
  unitCost: payload.unitCost != null ? `${payload.unitCost}` : "",
  totalCost: payload.totalCost != null ? `${payload.totalCost}` : "",
  purchaseDate: payload.purchaseDate ?? new Date().toISOString().slice(0, 10),
  supplierName: payload.supplierName ?? "",
});

export const parsePositiveNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const normalized = Number(value.replace(",", "."));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
};

export const shouldRequireLotId = (trackLot: boolean): boolean => trackLot;

export const hasInvalidDateRange = (
  fromDate?: string,
  toDate?: string
): boolean => Boolean(fromDate && toDate && fromDate > toDate);

export const buildPayloadFromForm = ({
  form,
  selectedItemId,
  selectedTrackLot,
}: {
  form: InventoryFormState;
  selectedItemId: string;
  selectedTrackLot: boolean;
}): BuildPayloadResult => {
  const quantity = parsePositiveNumber(form.quantity);
  const itemId = parsePositiveNumber(selectedItemId);
  const requiresLotId = shouldRequireLotId(selectedTrackLot);
  const lotIdText = form.lotId?.trim() ?? "";
  const reasonText = form.reason?.trim() ?? "";
  const unitCostText = form.unitCost?.trim() ?? "";
  const totalCostText = form.totalCost?.trim() ?? "";
  const purchaseDateText = form.purchaseDate?.trim() ?? "";
  const supplierNameText = form.supplierName?.trim() ?? "";
  const hasLotIdValue = Boolean(lotIdText);
  const rawLotId = hasLotIdValue ? parsePositiveNumber(lotIdText) : undefined;
  const lotId = requiresLotId ? rawLotId : undefined;

  if (itemId == null) {
    return { error: "Selecione um produto." };
  }

  if (quantity == null) {
    return { error: "Informe uma quantidade maior que zero." };
  }

  if (requiresLotId && !hasLotIdValue) {
    return { error: "Selecione um lote válido para este produto." };
  }

  if (requiresLotId && lotId == null) {
    return { error: "Selecione um lote válido para este produto." };
  }

  if (form.type === "ADJUST" && !form.adjustDirection) {
    return { error: "Selecione a direção do ajuste." };
  }

  const hasPurchaseDetails = Boolean(
    unitCostText || totalCostText || purchaseDateText || supplierNameText
  );
  const unitCost = unitCostText ? parsePositiveNumber(unitCostText) : null;
  const totalCost = totalCostText ? parsePositiveNumber(totalCostText) : null;

  if (hasPurchaseDetails) {
    if (form.type !== "IN") {
      return { error: "Custo de compra só pode ser informado em entradas de estoque." };
    }

    if (!purchaseDateText) {
      return { error: "Informe a data da compra." };
    }

    if (unitCost == null && totalCost == null) {
      return { error: "Informe o custo unitário ou o custo total da compra." };
    }

    if (unitCostText && unitCost == null) {
      return { error: "Informe um custo unitário válido." };
    }

    if (totalCostText && totalCost == null) {
      return { error: "Informe um custo total válido." };
    }
  }

  return {
    payload: {
      type: form.type,
      quantity,
      itemId,
      ...(lotId != null ? { lotId } : {}),
      ...(form.type === "ADJUST" && form.adjustDirection
        ? { adjustDirection: form.adjustDirection }
        : {}),
      ...(form.movementDate ? { movementDate: form.movementDate } : {}),
      ...(reasonText ? { reason: reasonText } : {}),
      ...(hasPurchaseDetails && unitCost != null ? { unitCost } : {}),
      ...(hasPurchaseDetails && totalCost != null ? { totalCost } : {}),
      ...(hasPurchaseDetails && purchaseDateText ? { purchaseDate: purchaseDateText } : {}),
      ...(hasPurchaseDetails && supplierNameText
        ? { supplierName: supplierNameText }
        : {}),
    },
  };
};

export const validateInventoryItemPayload = (
  request: InventoryItemCreateRequest
): string | null => {
  const name = request.name.trim();

  if (!name) {
    return "Informe o nome do item.";
  }

  if (name.length > 120) {
    return "O nome do produto deve ter no máximo 120 caracteres.";
  }

  return null;
};

export const validateInventoryLotPayload = (
  request: Pick<InventoryLotCreateRequest, "code" | "description">,
  hasSelectedItem: boolean
): string | null => {
  const code = request.code.trim();
  const description = request.description?.trim();

  if (!hasSelectedItem) {
    return "Selecione um produto com controle por lote antes de cadastrar um lote.";
  }

  if (!code) {
    return "Informe o código do lote.";
  }

  if (code.length > 80) {
    return "O código do lote deve ter no máximo 80 caracteres.";
  }

  if (description && description.length > 500) {
    return "A descrição do lote deve ter no máximo 500 caracteres.";
  }

  return null;
};

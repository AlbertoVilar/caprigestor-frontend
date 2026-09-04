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
  isPurchase: boolean;
  unitCost: string;
  freightCost: string;
  discountAmount: string;
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
  isPurchase: false,
  unitCost: "",
  freightCost: "",
  discountAmount: "",
  purchaseDate: "",
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
): InventoryFormState => {
  const freightCost = payload.freightCost ?? 0;
  const discountAmount = payload.discountAmount ?? 0;
  const inferredUnitCost = payload.unitCost ?? (
    payload.totalCost != null && payload.quantity > 0
      ? (payload.totalCost - freightCost + discountAmount) / payload.quantity
      : undefined
  );
  const isPurchase = payload.type === "IN" && Boolean(
    inferredUnitCost != null
    || payload.totalCost != null
    || payload.purchaseDate
    || payload.supplierName
  );

  return {
    type: payload.type,
    quantity: `${payload.quantity}`,
    lotId: payload.lotId != null ? `${payload.lotId}` : "",
    adjustDirection: payload.type === "ADJUST" ? payload.adjustDirection ?? "" : "",
    movementDate: payload.movementDate ?? new Date().toISOString().slice(0, 10),
    reason: payload.reason ?? "",
    isPurchase,
    unitCost: inferredUnitCost != null ? `${Number(inferredUnitCost.toFixed(4))}` : "",
    freightCost: payload.freightCost != null ? `${payload.freightCost}` : "",
    discountAmount: payload.discountAmount != null ? `${payload.discountAmount}` : "",
    purchaseDate: isPurchase
      ? payload.purchaseDate ?? new Date().toISOString().slice(0, 10)
      : "",
    supplierName: payload.supplierName ?? "",
  };
};

export const parsePositiveNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const normalized = Number(value.replace(",", "."));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
};

export const parseNonNegativeNumber = (value: string): number | null => {
  if (!value.trim()) return 0;
  const normalized = Number(value.replace(",", "."));
  if (!Number.isFinite(normalized) || normalized < 0) {
    return null;
  }
  return normalized;
};

const parseScaledDecimal = (value: string, scale: number): bigint | null => {
  const normalized = value.trim().replace(",", ".");
  if (!normalized || !/^\d+(?:\.\d+)?$/.test(normalized)) return null;

  const [integerPart, fractionPart = ""] = normalized.split(".");
  if (fractionPart.length > scale) return null;

  return BigInt(integerPart) * 10n ** BigInt(scale)
    + BigInt(fractionPart.padEnd(scale, "0"));
};

const roundScaledValue = (value: bigint, fromScale: number, toScale: number): bigint => {
  const divisor = 10n ** BigInt(fromScale - toScale);
  return (value + divisor / 2n) / divisor;
};

export type PurchaseCostCalculation = {
  subtotalCents: bigint;
  freightCents: bigint;
  discountCents: bigint;
  totalCents: bigint;
};

export const calculatePurchaseCost = (
  quantity: string,
  unitCost: string,
  freightCost: string,
  discountAmount: string
): PurchaseCostCalculation | null => {
  const quantityMilliunits = parseScaledDecimal(quantity, 3);
  const unitCostTenThousandths = parseScaledDecimal(unitCost, 4);
  const freightCents = parseScaledDecimal(freightCost || "0", 2);
  const discountCents = parseScaledDecimal(discountAmount || "0", 2);

  if (
    quantityMilliunits == null
    || quantityMilliunits <= 0n
    || unitCostTenThousandths == null
    || unitCostTenThousandths <= 0n
    || freightCents == null
    || discountCents == null
  ) {
    return null;
  }

  const subtotalCents = roundScaledValue(
    quantityMilliunits * unitCostTenThousandths,
    7,
    2
  );
  const totalCents = subtotalCents + freightCents - discountCents;

  return { subtotalCents, freightCents, discountCents, totalCents };
};

export const formatCents = (value: bigint): string =>
  (Number(value) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  const freightCostText = form.freightCost?.trim() ?? "";
  const discountAmountText = form.discountAmount?.trim() ?? "";
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

  const hasPurchaseDetails = form.isPurchase;
  const unitCost = unitCostText ? parsePositiveNumber(unitCostText) : null;
  const freightCost = parseNonNegativeNumber(freightCostText);
  const discountAmount = parseNonNegativeNumber(discountAmountText);

  if (hasPurchaseDetails) {
    if (form.type !== "IN") {
      return { error: "Custo de compra só pode ser informado em entradas de estoque." };
    }

    if (!purchaseDateText) {
      return { error: "Informe a data da compra." };
    }

    if (unitCost == null) {
      return { error: "Informe um custo unitário válido." };
    }

    if (freightCost == null) {
      return { error: "Informe um valor de frete válido." };
    }

    if (discountAmount == null) {
      return { error: "Informe um desconto válido." };
    }

    const calculation = calculatePurchaseCost(
      form.quantity,
      form.unitCost,
      form.freightCost,
      form.discountAmount
    );
    if (calculation == null) {
      return { error: "Revise quantidade e valores da compra." };
    }

    if (calculation.totalCents <= 0n) {
      return { error: "O desconto deve ser menor que a soma do subtotal com o frete." };
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
      ...(hasPurchaseDetails && freightCost != null ? { freightCost } : {}),
      ...(hasPurchaseDetails && discountAmount != null ? { discountAmount } : {}),
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

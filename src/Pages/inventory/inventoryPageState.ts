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
  const hasLotIdValue = Boolean(form.lotId.trim());
  const rawLotId = hasLotIdValue ? parsePositiveNumber(form.lotId) : undefined;
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
      ...(form.reason.trim() ? { reason: form.reason.trim() } : {}),
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
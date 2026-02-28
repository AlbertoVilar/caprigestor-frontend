import type {
  InventoryAdjustDirection,
  InventoryItemCreateRequest,
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

export type BuildPayloadResult = {
  payload?: InventoryMovementCreateRequestDTO;
  error?: string;
};

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
    return { error: "Selecione um item de estoque." };
  }

  if (quantity == null) {
    return { error: "Informe uma quantidade maior que zero." };
  }

  if (requiresLotId && !hasLotIdValue) {
    return { error: "Informe um lote válido para este item." };
  }

  if (requiresLotId && lotId == null) {
    return { error: "lotId deve ser um número positivo." };
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
    return "O nome do item deve ter no máximo 120 caracteres.";
  }

  return null;
};

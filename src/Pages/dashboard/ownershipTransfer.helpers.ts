import type { GoatResponseDTO } from "../../Models/goatResponseDTO";

export type OwnershipTransferIntent = {
  fingerprint: string;
  key: string;
};

export const resolveTechnicalGoatId = (
  goat: Pick<GoatResponseDTO, "technicalId" | "id">
): number | undefined => goat.technicalId ?? goat.id;

export const validateOwnershipTransferInput = ({
  technicalGoatId,
  currentFarmId,
  targetFarmId,
  reason,
}: {
  technicalGoatId: number | undefined;
  currentFarmId: number;
  targetFarmId: number;
  reason: string;
}): string | null => {
  if (
    typeof technicalGoatId !== "number" ||
    !Number.isSafeInteger(technicalGoatId) ||
    technicalGoatId <= 0
  ) {
    return "Não é possível transferir este animal sem identificador estrutural.";
  }

  if (
    !Number.isSafeInteger(targetFarmId) ||
    targetFarmId <= 0 ||
    targetFarmId === currentFarmId
  ) {
    return "Selecione uma fazenda de destino diferente da atual.";
  }

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    return "Informe o motivo da transferência.";
  }

  if (trimmedReason.length > 1000) {
    return "O motivo deve ter no máximo 1000 caracteres.";
  }

  return null;
};

export const getOwnershipTransferIntent = ({
  current,
  technicalGoatId,
  targetFarmId,
  reason,
  createKey,
}: {
  current: OwnershipTransferIntent | null;
  technicalGoatId: number;
  targetFarmId: number;
  reason: string;
  createKey: () => string;
}): OwnershipTransferIntent => {
  const fingerprint = `${technicalGoatId}|${targetFarmId}|${reason}`;
  if (current?.fingerprint === fingerprint) {
    return current;
  }

  return { fingerprint, key: createKey() };
};

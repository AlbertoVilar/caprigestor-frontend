import { requestBackEnd } from "../../utils/request";
import type {
  OwnershipMovementDirection,
  OwnershipMovementKind,
  OwnershipMovementPageDTO,
  OwnershipMovementStatus,
} from "../../Models/OwnershipMovementDTOs";

export async function listOwnershipMovements(
  farmId: number,
  direction: OwnershipMovementDirection,
  status?: OwnershipMovementStatus,
  kind?: OwnershipMovementKind,
  page = 0,
  size = 20,
): Promise<OwnershipMovementPageDTO> {
  const params: {
    direction: OwnershipMovementDirection;
    page: number;
    size: number;
    status?: OwnershipMovementStatus;
    kind?: OwnershipMovementKind;
  } = { direction, page, size };

  if (status) params.status = status;
  if (kind) params.kind = kind;

  const { data } = await requestBackEnd.get(
    `/goatfarms/${farmId}/ownership-movements`,
    { params },
  );
  return data;
}

import { requestBackEnd } from "../../utils/request";
import type {
  InternalOwnershipTransferRequestDTO,
  OwnershipTransferDirection,
  OwnershipTransferPageDTO,
  OwnershipTransferResponseDTO,
  OwnershipTransferStatus,
} from "../../Models/OwnershipTransferDTOs";

const transferPath = "/ownership-transfers";

export async function requestInternalTransfer(
  payload: InternalOwnershipTransferRequestDTO
): Promise<OwnershipTransferResponseDTO> {
  const { data } = await requestBackEnd.post(transferPath, payload);
  return data;
}

export async function getOwnershipTransfer(
  transferId: number
): Promise<OwnershipTransferResponseDTO> {
  const { data } = await requestBackEnd.get(`${transferPath}/${transferId}`);
  return data;
}

export async function acceptOwnershipTransfer(
  transferId: number
): Promise<OwnershipTransferResponseDTO> {
  const { data } = await requestBackEnd.post(`${transferPath}/${transferId}/accept`);
  return data;
}

export async function rejectOwnershipTransfer(
  transferId: number
): Promise<OwnershipTransferResponseDTO> {
  const { data } = await requestBackEnd.post(`${transferPath}/${transferId}/reject`);
  return data;
}

export async function cancelOwnershipTransfer(
  transferId: number
): Promise<OwnershipTransferResponseDTO> {
  const { data } = await requestBackEnd.post(`${transferPath}/${transferId}/cancel`);
  return data;
}

export async function listOwnershipTransfers(
  farmId: number,
  direction: OwnershipTransferDirection,
  status?: OwnershipTransferStatus,
  page = 0,
  size = 20
): Promise<OwnershipTransferPageDTO> {
  const params: {
    direction: OwnershipTransferDirection;
    page: number;
    size: number;
    status?: OwnershipTransferStatus;
  } = { direction, page, size };

  if (status !== undefined) {
    params.status = status;
  }

  const { data } = await requestBackEnd.get(
    `/goatfarms/${farmId}/ownership-transfers`,
    { params }
  );
  return data;
}

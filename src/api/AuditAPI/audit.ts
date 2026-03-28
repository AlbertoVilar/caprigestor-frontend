import type { OperationalAuditEntryDTO } from "../../Models/OperationalAuditDTOs";
import { requestBackEnd } from "../../utils/request";

type Envelope<T> = { data: T } | T;

function hasData<T>(value: unknown): value is { data: T } {
  return typeof value === "object" && value !== null && Object.prototype.hasOwnProperty.call(value, "data");
}

function unwrap<T>(value: Envelope<T>): T {
  return hasData<T>(value) ? value.data : (value as T);
}

const basePath = (farmId: number) => `/goatfarms/${farmId}/audit`;

export async function listOperationalAuditEntries(
  farmId: number,
  params?: { goatId?: string; limit?: number }
): Promise<OperationalAuditEntryDTO[]> {
  const search = new URLSearchParams();
  if (params?.goatId) {
    search.set("goatId", params.goatId);
  }
  if (params?.limit) {
    search.set("limit", String(params.limit));
  }

  const suffix = search.toString() ? `?${search.toString()}` : "";
  const { data } = await requestBackEnd.get(`${basePath(farmId)}/entries${suffix}`);
  const body = unwrap<OperationalAuditEntryDTO[] | { content?: OperationalAuditEntryDTO[] }>(data);
  return Array.isArray(body) ? body : body.content ?? [];
}

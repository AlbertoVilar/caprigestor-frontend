import { requestBackEnd } from "../../utils/request";
import { resolvePublicBaseUrl } from "../../utils/apiConfig";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type { GoatFarmUpdateRequest } from "@/Models/GoatFarmUpdateRequestDTO";
import type { GoatResponseDTO } from "@/Models/goatResponseDTO";
import type { GoatPageResponseDTO } from "@/Models/GoatPaginatedResponseDTO";
import { GoatFarmResponse } from "@/Models/GoatFarmResponseDTO";
import type { FarmPermissionsDTO } from "@/Models/FarmPermissionsDTO";
// Tipos específicos já definidos em GoatFarmUpdateRequestDTO
import { FarmCreateRequest } from "@/Models/FarmCreateRequestDTO";

// 🔹 Busca uma fazenda pelo ID
export async function getGoatFarmById(farmId: number): Promise<GoatFarmDTO> {
  const { data } = await requestBackEnd.get(`/goatfarms/${farmId}`);
  return normalizeFarmItem(data);
}

// 🔹 Busca todas as fazendas cadastradas no sistema (sem paginação)
export async function getAllFarms(): Promise<GoatFarmDTO[]> {
  console.log('Fazendo requisição para /goatfarms');
  const response = await requestBackEnd.get('/goatfarms');
  console.log('Resposta recebida:', response);
  console.log('Data:', response.data);
  const content = response.data?.content ?? response.data ?? [];
  return (content || []).map(normalizeFarmItem);
}

// 🔹 Busca todas as fazendas paginadas
export async function getAllFarmsPaginated(
  page: number = 0,
  size: number = 12
): Promise<{
  content: GoatFarmDTO[];
  page: { size: number; number: number; totalPages: number; totalElements: number };
}> {
  const { data } = await requestBackEnd.get('/goatfarms', { params: { page, size } });
  const content = (data?.content ?? []) as FarmItemLike[];
  const normalized = content.map((item) => normalizeFarmItem(item));
  const pageInfo = data?.page ?? {
    size: data?.size ?? size,
    number: data?.number ?? page,
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? normalized.length,
  };
  return { content: normalized, page: pageInfo };
}

// 🔹 Busca cabras de um capril específico com paginação
export async function getAllGoatsPaginated(
  farmId: number,
  page: number = 0,
  size: number = 12
): Promise<GoatPageResponseDTO> {
  const { data } = await requestBackEnd.get('/goatfarms/goats', { params: { page, size } });
  return data;
}

// 🔹 Busca cabra pelo número de registro
// NOTA: Esta função usa a rota específica do GoatFarm API que inclui o contexto da fazenda
// Para busca global sem contexto de fazenda, use a função do GoatAPI
export async function fetchGoatByRegistrationNumber(
  registrationNumber: string
): Promise<GoatResponseDTO | null> {
  try {
    const { data } = await requestBackEnd.get(`/goatfarms/goats/registration/${encodeURIComponent(registrationNumber)}`);
    return data;
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw new Error("Erro ao buscar cabra por número de registro");
  }
}

// 🔹 Busca uma fazenda pelo nome
export async function fetchFarmByName(name: string): Promise<GoatFarmDTO> {
  const { data } = await requestBackEnd.get('/goatfarms/name', { params: { name } });
  return data;
}

// 🔹 Cria uma nova fazenda com dados aninhados (owner, address, phones, farm)
export async function createFarm(data: FarmCreateRequest): Promise<GoatFarmResponse> {
  const { data: response } = await requestBackEnd.post('/auth/register-farm', data);
  return response;
}

// 🔹 Cria uma nova fazenda completa (farm, user, address, phones) - requer autenticação
export async function createFullFarm(data: FarmCreateRequest): Promise<GoatFarmResponse> {
  const { data: response } = await requestBackEnd.post('/goatfarms/full', data);
  return response;
}

// 🔹 Atualiza uma fazenda com dados aninhados (PUT)
export async function updateGoatFarmFull(
  farmId: number,
  data: GoatFarmUpdateRequest
): Promise<void> {
  console.log("Enviando PUT para /goatfarms/" + farmId, data);
  await requestBackEnd.put(`/goatfarms/${farmId}`, data);
}

// 🔹 Deleta um telefone de uma fazenda
export async function deleteGoatFarmPhone(farmId: number, phoneId: number): Promise<void> {
  console.log(`Deletando telefone ${phoneId} da fazenda ${farmId}`);
  await requestBackEnd.delete(`/goatfarms/${farmId}/phones/${phoneId}`);
}

// Permissoes da fazenda (backend source of truth)
export async function getFarmPermissions(farmId: number): Promise<FarmPermissionsDTO> {
  const { data } = await requestBackEnd.get(`/goatfarms/${farmId}/permissions`);
  return data;
}

// 🔹 Permissões da fazenda (canCreateGoat, etc.)
// Removido: permissões de fazenda são determinadas por roles/ownership no frontend

// 🔹 Deleta uma fazenda pelo ID
export async function deleteGoatFarm(farmId: number): Promise<void> {
  await requestBackEnd.delete(`/goatfarms/${farmId}`);
}

// 🔹 Normaliza item de fazenda para GoatFarmDTO (suporta resposta plana e aninhada)
function normalizeFarmItem(item: FarmItemLike): GoatFarmDTO {
  const userId = Number(item.userId ?? item.user?.id ?? 0);
  const userName = item.userName ?? item.user?.name ?? '';
  const userEmail = item.userEmail ?? item.user?.email ?? '';
  const userCpf = item.userCpf ?? item.user?.cpf ?? '';

  const addressId = Number(item.addressId ?? item.address?.id ?? 0);
  const street = item.street ?? item.address?.street ?? '';
  const district = item.district ?? item.address?.neighborhood ?? '';
  const city = item.city ?? item.address?.city ?? '';
  const state = item.state ?? item.address?.state ?? '';
  const cep = item.cep ?? item.address?.zipCode ?? '';

  const id = Number(item.id ?? item.farm?.id ?? 0);
  const name = item.name ?? item.farm?.name ?? '';
  const tod = item.tod ?? item.farm?.tod ?? '';
  const version = item.version ?? item.farm?.version;

  const createdAt = item.createdAt ?? '';
  const updatedAt = item.updatedAt ?? '';

  const phones = (item.phones ?? item.farm?.phones ?? []).map((p) => ({
    id: Number(p.id ?? 0),
    ddd: p.ddd ?? '',
    number: p.number ?? '',
  }));

  const logoUrl = normalizeLogoUrl(item.logoUrl ?? item.farm?.logoUrl);

  return {
    id,
    name,
    tod,
    createdAt,
    updatedAt,
    version,
    userId,
    userName,
    userEmail,
    userCpf,
    addressId,
    street,
    district,
    city,
    state,
    cep,
    phones,
    logoUrl,
  };
}

function normalizeLogoUrl(rawLogoUrl?: string): string | undefined {
  const trimmed = rawLogoUrl?.trim();

  if (!trimmed) {
    return undefined;
  }

  const isAbsolute = /^(?:[a-z]+:)?\/\//i.test(trimmed) || trimmed.startsWith("data:");
  if (isAbsolute) {
    return trimmed;
  }

  const publicBaseUrl = resolvePublicBaseUrl();
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${publicBaseUrl}${normalizedPath}`;
}

type PhoneLike = {
  id?: number;
  ddd?: string;
  number?: string;
};

type FarmItemLike = {
  userId?: number;
  userName?: string;
  userEmail?: string;
  userCpf?: string;
  addressId?: number;
  street?: string;
  district?: string;
  city?: string;
  state?: string;
  cep?: string;
  id?: number;
  name?: string;
  tod?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  logoUrl?: string;
  user?: {
    id?: number;
    name?: string;
    email?: string;
    cpf?: string;
  };
  address?: {
    id?: number;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  farm?: {
    id?: number;
    name?: string;
    tod?: string;
    version?: number;
    logoUrl?: string;
    phones?: PhoneLike[];
  };
  phones?: PhoneLike[];
};

import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import { requestBackEnd } from "../../utils/request";

// 🔍 Busca todas as cabras cadastradas (sem paginação) – OBSOLETO ou para fins administrativos
export async function getAllGoats(): Promise<GoatResponseDTO[]> {
  const { data } = await requestBackEnd.get('/goatfarms/goats');
  return data.content;
}

// 🔍 Busca cabras por nome dentro de uma fazenda
export async function searchGoatsByNameAndFarmId(
  farmId: number,
  name: string
): Promise<GoatResponseDTO[]> {
  const { data } = await requestBackEnd.get(`/goatfarms/${farmId}/goats/name`, { params: { name } });
  return data.content;
}

// ✅ Busca cabras por ID da fazenda com paginação
export async function findGoatsByFarmIdPaginated(
  farmId: number,
  page: number,
  size: number
): Promise<{
  content: GoatResponseDTO[];
  page: { number: number; totalPages: number };
}> {
  const { data } = await requestBackEnd.get(`/goatfarms/${farmId}/goats`, { params: { page, size } });
  return data;
}

// ✅ Busca única por número de registro da cabra (sem vínculo com fazenda)
export async function fetchGoatByRegistrationNumber(
  registrationNumber: string
): Promise<GoatResponseDTO> {
  const { data } = await requestBackEnd.get(`/goats/${registrationNumber}`);
  return data;
}

// ✅ Criação de nova cabra
export async function createGoat(
  goatData: GoatRequestDTO
): Promise<GoatResponseDTO> {
  const { data } = await requestBackEnd.post('/goatfarms/goats', goatData);
  return data;
}

// ✅ Atualização de cabra existente
export async function updateGoat(
  registrationNumber: string,
  goat: GoatRequestDTO
): Promise<void> {
  await requestBackEnd.put(`/goatfarms/goats/${registrationNumber}`, goat);
}

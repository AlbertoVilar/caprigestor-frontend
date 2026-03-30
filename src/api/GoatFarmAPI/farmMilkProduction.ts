import { requestBackEnd } from "../../utils/request";
import type {
  FarmMilkProductionAnnualSummaryDTO,
  FarmMilkProductionDailySummaryDTO,
  FarmMilkProductionMonthlySummaryDTO,
  FarmMilkProductionUpsertRequestDTO,
} from "../../Models/FarmMilkProductionDTOs";

const getBaseUrl = (farmId: number) =>
  `/goatfarms/${farmId}/milk-consolidated-productions`;

export async function upsertFarmMilkProductionDaily(
  farmId: number,
  productionDate: string,
  payload: FarmMilkProductionUpsertRequestDTO
): Promise<FarmMilkProductionDailySummaryDTO> {
  const { data } = await requestBackEnd.put(
    `${getBaseUrl(farmId)}/${productionDate}`,
    payload
  );
  return data;
}

export async function getFarmMilkProductionDailySummary(
  farmId: number,
  date: string
): Promise<FarmMilkProductionDailySummaryDTO> {
  const { data } = await requestBackEnd.get(`${getBaseUrl(farmId)}/daily`, {
    params: { date },
  });
  return data;
}

export async function getFarmMilkProductionMonthlySummary(
  farmId: number,
  year: number,
  month: number
): Promise<FarmMilkProductionMonthlySummaryDTO> {
  const { data } = await requestBackEnd.get(`${getBaseUrl(farmId)}/monthly`, {
    params: { year, month },
  });
  return data;
}

export async function getFarmMilkProductionAnnualSummary(
  farmId: number,
  year: number
): Promise<FarmMilkProductionAnnualSummaryDTO> {
  const { data } = await requestBackEnd.get(`${getBaseUrl(farmId)}/annual`, {
    params: { year },
  });
  return data;
}

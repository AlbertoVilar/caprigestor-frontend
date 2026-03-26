import type {
  AnimalSaleRequestDTO,
  AnimalSaleResponseDTO,
  CommercialSummaryDTO,
  CustomerRequestDTO,
  CustomerResponseDTO,
  MilkSaleRequestDTO,
  MilkSaleResponseDTO,
  ReceivableResponseDTO,
  SalePaymentRequestDTO,
} from "../../Models/CommercialDTOs";
import { requestBackEnd } from "../../utils/request";

type Envelope<T> = { data: T } | T;

function hasData<T>(value: unknown): value is { data: T } {
  return typeof value === "object" && value !== null && Object.prototype.hasOwnProperty.call(value, "data");
}

function unwrap<T>(value: Envelope<T>): T {
  return hasData<T>(value) ? value.data : (value as T);
}

const basePath = (farmId: number) => `/goatfarms/${farmId}/commercial`;

export async function createCustomer(farmId: number, payload: CustomerRequestDTO): Promise<CustomerResponseDTO> {
  const { data } = await requestBackEnd.post(`${basePath(farmId)}/customers`, payload);
  return unwrap<CustomerResponseDTO>(data);
}

export async function listCustomers(farmId: number): Promise<CustomerResponseDTO[]> {
  const { data } = await requestBackEnd.get(`${basePath(farmId)}/customers`);
  const body = unwrap<CustomerResponseDTO[] | { content?: CustomerResponseDTO[] }>(data);
  return Array.isArray(body) ? body : body.content ?? [];
}

export async function createAnimalSale(farmId: number, payload: AnimalSaleRequestDTO): Promise<AnimalSaleResponseDTO> {
  const { data } = await requestBackEnd.post(`${basePath(farmId)}/animal-sales`, payload);
  return unwrap<AnimalSaleResponseDTO>(data);
}

export async function listAnimalSales(farmId: number): Promise<AnimalSaleResponseDTO[]> {
  const { data } = await requestBackEnd.get(`${basePath(farmId)}/animal-sales`);
  const body = unwrap<AnimalSaleResponseDTO[] | { content?: AnimalSaleResponseDTO[] }>(data);
  return Array.isArray(body) ? body : body.content ?? [];
}

export async function registerAnimalSalePayment(
  farmId: number,
  saleId: number,
  payload: SalePaymentRequestDTO
): Promise<AnimalSaleResponseDTO> {
  const { data } = await requestBackEnd.patch(`${basePath(farmId)}/animal-sales/${saleId}/payment`, payload);
  return unwrap<AnimalSaleResponseDTO>(data);
}

export async function createMilkSale(farmId: number, payload: MilkSaleRequestDTO): Promise<MilkSaleResponseDTO> {
  const { data } = await requestBackEnd.post(`${basePath(farmId)}/milk-sales`, payload);
  return unwrap<MilkSaleResponseDTO>(data);
}

export async function listMilkSales(farmId: number): Promise<MilkSaleResponseDTO[]> {
  const { data } = await requestBackEnd.get(`${basePath(farmId)}/milk-sales`);
  const body = unwrap<MilkSaleResponseDTO[] | { content?: MilkSaleResponseDTO[] }>(data);
  return Array.isArray(body) ? body : body.content ?? [];
}

export async function registerMilkSalePayment(
  farmId: number,
  saleId: number,
  payload: SalePaymentRequestDTO
): Promise<MilkSaleResponseDTO> {
  const { data } = await requestBackEnd.patch(`${basePath(farmId)}/milk-sales/${saleId}/payment`, payload);
  return unwrap<MilkSaleResponseDTO>(data);
}

export async function listReceivables(farmId: number): Promise<ReceivableResponseDTO[]> {
  const { data } = await requestBackEnd.get(`${basePath(farmId)}/receivables`);
  const body = unwrap<ReceivableResponseDTO[] | { content?: ReceivableResponseDTO[] }>(data);
  return Array.isArray(body) ? body : body.content ?? [];
}

export async function fetchCommercialSummary(farmId: number): Promise<CommercialSummaryDTO> {
  const { data } = await requestBackEnd.get(`${basePath(farmId)}/summary`);
  return unwrap<CommercialSummaryDTO>(data);
}

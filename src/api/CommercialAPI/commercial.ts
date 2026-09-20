import type {
  AnimalSaleRequestDTO,
  AnimalSaleResponseDTO,
  CommercialSummaryDTO,
  CustomerRequestDTO,
  CustomerResponseDTO,
  MilkSaleRequestDTO,
  MilkSaleResponseDTO,
  MonthlyOperationalSummaryDTO,
  OperationalExpenseRequestDTO,
  OperationalExpenseResponseDTO,
  ReceivableResponseDTO,
  SalePaymentRequestDTO,
  OwnershipSaleRequestDTO,
  OwnershipSaleResponseDTO,
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

export async function requestOwnershipSale(
  farmId: number,
  payload: OwnershipSaleRequestDTO
): Promise<OwnershipSaleResponseDTO> {
  const { data } = await requestBackEnd.post(`${basePath(farmId)}/ownership-sales`, payload);
  return unwrap<OwnershipSaleResponseDTO>(data);
}

export async function acceptOwnershipSale(
  sourceFarmId: number,
  saleId: number
): Promise<OwnershipSaleResponseDTO> {
  const { data } = await requestBackEnd.post(`${basePath(sourceFarmId)}/ownership-sales/${saleId}/accept`);
  return unwrap<OwnershipSaleResponseDTO>(data);
}

export async function registerOwnershipSalePayment(
  sourceFarmId: number,
  saleId: number,
  payload: SalePaymentRequestDTO
): Promise<OwnershipSaleResponseDTO> {
  const { data } = await requestBackEnd.patch(`${basePath(sourceFarmId)}/ownership-sales/${saleId}/payment`, payload);
  return unwrap<OwnershipSaleResponseDTO>(data);
}

export async function rejectOwnershipSale(sourceFarmId: number, saleId: number): Promise<OwnershipSaleResponseDTO> {
  const { data } = await requestBackEnd.post(`${basePath(sourceFarmId)}/ownership-sales/${saleId}/reject`);
  return unwrap<OwnershipSaleResponseDTO>(data);
}

export async function cancelOwnershipSale(sourceFarmId: number, saleId: number): Promise<OwnershipSaleResponseDTO> {
  const { data } = await requestBackEnd.post(`${basePath(sourceFarmId)}/ownership-sales/${saleId}/cancel`);
  return unwrap<OwnershipSaleResponseDTO>(data);
}

export async function listIncomingOwnershipSales(farmId: number): Promise<OwnershipSaleResponseDTO[]> {
  const { data } = await requestBackEnd.get(`${basePath(farmId)}/ownership-sales/incoming`);
  const body = unwrap<OwnershipSaleResponseDTO[] | { content?: OwnershipSaleResponseDTO[] }>(data);
  return Array.isArray(body) ? body : body.content ?? [];
}

export async function listOutgoingOwnershipSales(farmId: number): Promise<OwnershipSaleResponseDTO[]> {
  const { data } = await requestBackEnd.get(`${basePath(farmId)}/ownership-sales/outgoing`);
  const body = unwrap<OwnershipSaleResponseDTO[] | { content?: OwnershipSaleResponseDTO[] }>(data);
  return Array.isArray(body) ? body : body.content ?? [];
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

export async function createOperationalExpense(
  farmId: number,
  payload: OperationalExpenseRequestDTO
): Promise<OperationalExpenseResponseDTO> {
  const { data } = await requestBackEnd.post(`${basePath(farmId)}/operational-expenses`, payload);
  return unwrap<OperationalExpenseResponseDTO>(data);
}

export async function listOperationalExpenses(
  farmId: number
): Promise<OperationalExpenseResponseDTO[]> {
  const { data } = await requestBackEnd.get(`${basePath(farmId)}/operational-expenses`);
  const body = unwrap<OperationalExpenseResponseDTO[] | { content?: OperationalExpenseResponseDTO[] }>(data);
  return Array.isArray(body) ? body : body.content ?? [];
}

export async function fetchMonthlyOperationalSummary(
  farmId: number,
  year: number,
  month: number
): Promise<MonthlyOperationalSummaryDTO> {
  const { data } = await requestBackEnd.get(`${basePath(farmId)}/monthly-summary`, {
    params: { year, month },
  });
  return unwrap<MonthlyOperationalSummaryDTO>(data);
}

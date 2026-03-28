export type SalePaymentStatus = "OPEN" | "PAID";
export type ReceivableSourceType = "ANIMAL_SALE" | "MILK_SALE";
export type OperationalExpenseCategory =
  | "ENERGY"
  | "WATER"
  | "FREIGHT"
  | "MAINTENANCE"
  | "VETERINARY"
  | "FUEL"
  | "LABOR"
  | "FEES"
  | "OTHER";

export interface CustomerRequestDTO {
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CustomerResponseDTO {
  id: number;
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  active: boolean;
}

export interface AnimalSaleRequestDTO {
  goatId: string;
  customerId: number;
  saleDate: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  notes?: string;
}

export interface AnimalSaleResponseDTO {
  id: number;
  goatRegistrationNumber: string;
  goatName: string;
  customerId: number;
  customerName: string;
  saleDate: string;
  amount: number;
  dueDate: string;
  paymentStatus: SalePaymentStatus;
  paymentDate?: string | number[] | null;
  notes?: string | null;
}

export interface MilkSaleRequestDTO {
  customerId: number;
  saleDate: string;
  quantityLiters: number;
  unitPrice: number;
  dueDate: string;
  paymentDate?: string;
  notes?: string;
}

export interface MilkSaleResponseDTO {
  id: number;
  customerId: number;
  customerName: string;
  saleDate: string;
  quantityLiters: number;
  unitPrice: number;
  totalAmount: number;
  dueDate: string;
  paymentStatus: SalePaymentStatus;
  paymentDate?: string | number[] | null;
  notes?: string | null;
}

export interface SalePaymentRequestDTO {
  paymentDate: string;
}

export interface ReceivableResponseDTO {
  sourceType: ReceivableSourceType;
  sourceId: number;
  sourceLabel: string;
  customerId: number;
  customerName: string;
  amount: number;
  dueDate: string;
  paymentStatus: SalePaymentStatus;
  paymentDate?: string | number[] | null;
  notes?: string | null;
}

export interface CommercialSummaryDTO {
  customerCount: number;
  animalSalesCount: number;
  animalSalesTotal: number;
  milkSalesCount: number;
  milkSalesQuantityLiters: number;
  milkSalesTotal: number;
  openReceivablesCount: number;
  openReceivablesTotal: number;
  paidReceivablesCount: number;
  paidReceivablesTotal: number;
}

export interface OperationalExpenseRequestDTO {
  category: OperationalExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  notes?: string;
}

export interface OperationalExpenseResponseDTO {
  id: number;
  category: OperationalExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string | number[];
  notes?: string | null;
  createdAt?: string | number[] | null;
}

export interface MonthlyOperationalSummaryDTO {
  year: number;
  month: number;
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  animalSalesRevenue: number;
  milkSalesRevenue: number;
  operationalExpensesTotal: number;
  inventoryPurchaseCostsTotal: number;
}

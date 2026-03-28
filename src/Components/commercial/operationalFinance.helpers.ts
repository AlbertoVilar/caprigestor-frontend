import type {
  MonthlyOperationalSummaryDTO,
  OperationalExpenseCategory,
} from "../../Models/CommercialDTOs";
import { formatCommercialCurrency } from "../../Pages/commercial/commercial.helpers";

export function formatOperationalExpenseCategoryLabel(category: OperationalExpenseCategory): string {
  switch (category) {
    case "ENERGY":
      return "Energia";
    case "WATER":
      return "Agua";
    case "FREIGHT":
      return "Frete";
    case "MAINTENANCE":
      return "Manutencao";
    case "VETERINARY":
      return "Servico veterinario";
    case "FUEL":
      return "Combustivel";
    case "LABOR":
      return "Mao de obra";
    case "FEES":
      return "Taxas";
    default:
      return "Outras";
  }
}

export function buildMonthlyOperationalSummaryCards(summary: MonthlyOperationalSummaryDTO) {
  return [
    { label: "Entrou no mes", value: formatCommercialCurrency(summary.totalRevenue) },
    { label: "Saiu no mes", value: formatCommercialCurrency(summary.totalExpenses) },
    { label: "Saldo operacional", value: formatCommercialCurrency(summary.balance) },
    { label: "Vendas de animais recebidas", value: formatCommercialCurrency(summary.animalSalesRevenue) },
    { label: "Vendas de leite recebidas", value: formatCommercialCurrency(summary.milkSalesRevenue) },
    { label: "Despesas operacionais", value: formatCommercialCurrency(summary.operationalExpensesTotal) },
    { label: "Compras de estoque", value: formatCommercialCurrency(summary.inventoryPurchaseCostsTotal) },
  ];
}

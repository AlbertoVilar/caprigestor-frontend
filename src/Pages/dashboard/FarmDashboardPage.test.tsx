import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { FarmDashboardData } from "./FarmDashboardPage";
import { FarmDashboardPageView } from "./FarmDashboardPage";

vi.mock("../../Components/pages-headers/GoatFarmHeader", () => ({
  default: ({ name }: { name: string }) => <div>{name}</div>,
}));

vi.mock("../../Components/pages-headers/ContextBreadcrumb", () => ({
  default: ({ items }: { items: Array<{ label: string }> }) => (
    <nav>{items.map((item) => item.label).join(" > ")}</nav>
  ),
}));

describe("FarmDashboardPageView", () => {
  const baseData: FarmDashboardData = {
    farmData: {
      id: 7,
      name: "Capril Vilar",
      tod: "12345",
      createdAt: "2026-01-01",
      updatedAt: "2026-03-11",
      userId: 1,
      userName: "Alberto",
      userEmail: "alberto@example.com",
      userCpf: "00000000000",
      addressId: 11,
      street: "Rua A",
      district: "Centro",
      city: "Belo Horizonte",
      state: "MG",
      cep: "30100-000",
      phones: [],
      logoUrl: "",
    },
    herdSummary: {
      total: 128,
      males: 19,
      females: 109,
      active: 117,
      inactive: 4,
      sold: 5,
      deceased: 2,
      breeds: [
        { breed: "Saanen", count: 48 },
        { breed: "Boer", count: 32 },
      ],
    },
    reproductionAlerts: {
      totalPending: 3,
      alerts: [],
    },
    lactationAlerts: {
      totalPending: 2,
      alerts: [],
    },
    healthAlerts: {
      dueTodayCount: 1,
      upcomingCount: 4,
      overdueCount: 1,
      dueTodayTop: [
        {
          id: 501,
          farmId: 7,
          goatId: "GOAT-001",
          type: "VACINA",
          status: "AGENDADO",
          title: "Vacina clostridial",
          scheduledDate: "2026-03-11",
          overdue: false,
        },
      ],
      upcomingTop: [
        {
          id: 502,
          farmId: 7,
          goatId: "GOAT-003",
          type: "VERMIFUGACAO",
          status: "AGENDADO",
          title: "Vermifugação",
          scheduledDate: "2026-03-13",
          overdue: false,
        },
      ],
      overdueTop: [
        {
          id: 503,
          farmId: 7,
          goatId: "GOAT-002",
          type: "MEDICACAO",
          status: "AGENDADO",
          title: "Medicamento pós-parto",
          scheduledDate: "2026-03-09",
          overdue: true,
        },
      ],
    },
    inventoryItems: {
      content: [{ id: 11, name: "Ração", trackLot: true, active: true }],
      page: {
        number: 0,
        size: 1,
        totalElements: 14,
        totalPages: 14,
      },
    },
    inventoryBalances: {
      content: [
        { itemId: 11, itemName: "Ração", trackLot: true, lotId: 99, quantity: 120 },
      ],
      page: {
        number: 0,
        size: 5,
        totalElements: 6,
        totalPages: 2,
      },
    },
    inventoryMovements: {
      content: [
        {
          movementId: 800,
          type: "OUT",
          quantity: 5,
          itemId: 11,
          itemName: "Ração",
          movementDate: "2026-03-10",
          resultingBalance: 120,
          createdAt: "2026-03-10T10:00:00Z",
        },
      ],
      page: {
        number: 0,
        size: 1,
        totalElements: 38,
        totalPages: 38,
      },
    },
  };

  it("renders the loading state", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <FarmDashboardPageView
          farmIdNumber={7}
          data={null}
          loading={true}
          error={null}
          sectionErrors={{}}
          onRetry={() => {}}
        />
      </MemoryRouter>
    );

    expect(html).toContain("Carregando dashboard da fazenda");
  });

  it("renders the error state with retry copy", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <FarmDashboardPageView
          farmIdNumber={7}
          data={null}
          loading={false}
          error="Falha ao carregar a fazenda"
          sectionErrors={{}}
          onRetry={() => {}}
        />
      </MemoryRouter>
    );

    expect(html).toContain("Não foi possível carregar a dashboard da fazenda");
    expect(html).toContain("Falha ao carregar a fazenda");
    expect(html).toContain("Tentar novamente");
  });

  it("renders the management blocks and navigation links", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <FarmDashboardPageView
          farmIdNumber={7}
          data={baseData}
          loading={false}
          error={null}
          sectionErrors={{}}
          onRetry={() => {}}
        />
      </MemoryRouter>
    );

    expect(html).toContain("Indicadores do rebanho");
    expect(html).toContain("Alertas resumidos");
    expect(html).toContain("Agenda sanitária da fazenda");
    expect(html).toContain("Estoque em resumo");
    expect(html).toContain("O que precisa da sua atenção hoje");
    expect(html).toContain('href="/app/goatfarms/7/alerts"');
    expect(html).toContain('href="/app/goatfarms/7/health-agenda"');
    expect(html).toContain('href="/app/goatfarms/7/inventory"');
    expect(html).toContain('href="/cabras?farmId=7"');
  });
});


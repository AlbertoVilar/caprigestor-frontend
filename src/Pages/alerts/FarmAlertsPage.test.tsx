import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FarmAlertsContent } from "./FarmAlertsPage";

const setSearchParamsSpy = vi.fn();
const navigateSpy = vi.fn();

vi.mock("react-router-dom", () => ({
  Link: ({ to, children, className }: { to: string; children: unknown; className?: string }) => (
    <a href={to} className={className}>{children}</a>
  ),
  useParams: () => ({ farmId: "7" }),
  useNavigate: () => navigateSpy,
  useSearchParams: () => [new URLSearchParams(), setSearchParamsSpy]
}));

vi.mock("../../contexts/alerts/FarmAlertsContext", () => ({
  useFarmAlerts: () => ({
    providerStates: [
      { providerKey: "reproduction_pregnancy_diagnosis", summary: { count: 2 }, loading: false, error: false },
      { providerKey: "lactation_drying", summary: { count: 1 }, loading: false, error: false },
      { providerKey: "health_agenda", summary: { count: 3 }, loading: false, error: false }
    ],
    getProvider: (key: string) => ({
      key,
      label: key,
      priority: 1,
      getSummary: async () => ({ count: 0 }),
      getList: async () => [],
      getRoute: (farmId: number) => `/app/goatfarms/${farmId}/alerts?type=${key}`
    }),
    refreshAlerts: async () => undefined
  })
}));

vi.mock("../../Components/pages-headers/GoatFarmHeader", () => ({
  default: ({ name }: { name: string }) => <div>{name}</div>
}));

vi.mock("../../Components/pages-headers/PageHeader", () => ({
  default: ({ title }: { title: string }) => <header>{title}</header>
}));

describe("FarmAlertsContent", () => {
  it("renders consolidated summary and filters", () => {
    const html = renderToStaticMarkup(<FarmAlertsContent />);

    expect(html).toContain("Alertas consolidados da fazenda");
    expect(html).toContain("Origem");
    expect(html).toContain("Reprodução");
    expect(html).toContain("Lactação");
    expect(html).toContain("Sanidade");
    expect(html).toContain("Nenhum alerta encontrado com os filtros selecionados.");
  });
});

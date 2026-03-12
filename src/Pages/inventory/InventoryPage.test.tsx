import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { InventoryItem, InventoryLot } from "../../Models/InventoryDTOs";
import {
  InventoryLotManagementCard,
  InventoryLotSelectorField,
} from "./InventoryPage";

type ButtonProps = {
  children?: ReactNode;
};

type CardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

type StateProps = {
  title: string;
  description: string;
};

type LoadingProps = {
  label: string;
};

type ContainerProps = {
  children?: ReactNode;
};

vi.mock("../../Components/ui", () => ({
  Button: ({ children }: ButtonProps) => <button>{children}</button>,
  Card: ({ title, description, actions, children }: CardProps) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {description ? <p>{description}</p> : null}
      {actions}
      <div>{children}</div>
    </section>
  ),
  EmptyState: ({ title, description }: StateProps) => (
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
  ErrorState: ({ title, description }: StateProps) => (
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
  LoadingState: ({ label }: LoadingProps) => <div>{label}</div>,
  Modal: ({ children }: ContainerProps) => <div>{children}</div>,
  Table: ({ children }: ContainerProps) => <table>{children}</table>,
}));

const trackedItem: InventoryItem = {
  id: 11,
  name: "Ração",
  trackLot: true,
  active: true,
};

const lots: InventoryLot[] = [
  {
    id: 301,
    farmId: 7,
    itemId: 11,
    code: "LOT-ATIVO",
    description: "Ração março",
    expirationDate: "2026-03-31",
    active: true,
  },
  {
    id: 302,
    farmId: 7,
    itemId: 11,
    code: "LOT-INATIVO",
    description: "Reserva",
    expirationDate: null,
    active: false,
  },
];

describe("Inventory lot UI blocks", () => {
  it("renders a real lot selector instead of manual lotId input", () => {
    const html = renderToStaticMarkup(
      <InventoryLotSelectorField
        selectedTrackLot={true}
        selectedItemId="11"
        selectedItemLots={lots.filter((lot) => lot.active)}
        selectedItemAllLotsCount={lots.length}
        loadingLots={false}
        canManageInventory={true}
        submitting={false}
        formLotId=""
        hasError={false}
        feedback={null}
        onOpenCreateLot={() => {}}
        onChange={() => {}}
      />
    );

    expect(html).toContain("Lote (obrigatório)");
    expect(html).toContain("Cadastrar lote");
    expect(html).toContain("LOT-ATIVO");
    expect(html).toContain("2 lote(s) cadastrado(s)");
    expect(html).not.toContain("Ex.: 10");
  });

  it("renders the lot management card with activate and deactivate actions", () => {
    const html = renderToStaticMarkup(
      <InventoryLotManagementCard
        selectedItem={trackedItem}
        selectedTrackLot={true}
        lotsPageTotal={lots.length}
        selectedItemAllLots={lots}
        lotsError={null}
        loadingLots={false}
        canManageInventory={true}
        updatingLotId={null}
        onOpenCreateLot={() => {}}
        onRetryLots={() => {}}
        onToggleLotActive={() => {}}
      />
    );

    expect(html).toContain("Lotes do produto selecionado");
    expect(html).toContain("Novo lote");
    expect(html).toContain("LOT-ATIVO");
    expect(html).toContain("LOT-INATIVO");
    expect(html).toContain("Inativar");
    expect(html).toContain("Ativar");
  });

  it("renders empty guidance when the selected product does not use lot control", () => {
    const html = renderToStaticMarkup(
      <InventoryLotManagementCard
        selectedItem={{ ...trackedItem, trackLot: false }}
        selectedTrackLot={false}
        lotsPageTotal={0}
        selectedItemAllLots={[]}
        lotsError={null}
        loadingLots={false}
        canManageInventory={true}
        updatingLotId={null}
        onOpenCreateLot={() => {}}
        onRetryLots={() => {}}
        onToggleLotActive={() => {}}
      />
    );

    expect(html).toContain("Produto sem controle por lote");
    expect(html).toContain("não exige lote");
  });
});
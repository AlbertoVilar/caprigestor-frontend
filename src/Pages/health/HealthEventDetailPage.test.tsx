// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HealthEventDetailPage from "./HealthEventDetailPage";

const mocks = vi.hoisted(() => ({
  getById: vi.fn(),
  markAsDone: vi.fn(),
  cancel: vi.fn(),
  reopen: vi.fn(),
  fetchGoatById: vi.fn(),
  navigate: vi.fn(),
  params: { farmId: "19", goatId: "1400800001", eventId: "7" },
}));

vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("../../Hooks/useFarmPermissions", () => ({
  useFarmPermissions: () => ({ canAdministerFarm: true, loading: false }),
}));

vi.mock("../../api/GoatFarmAPI/health", () => ({
  healthAPI: {
    getById: mocks.getById,
    markAsDone: mocks.markAsDone,
    cancel: mocks.cancel,
    reopen: mocks.reopen,
  },
}));

vi.mock("../../api/GoatAPI/goat", () => ({
  fetchGoatById: mocks.fetchGoatById,
}));

vi.mock("react-toastify", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("./components/DoneHealthEventModal", () => ({
  default: (props: { isOpen: boolean; onConfirm: (data: { responsible?: string }) => void }) =>
    props.isOpen ? <button data-testid="done-confirm" onClick={() => props.onConfirm({})}>confirm done</button> : null,
}));

vi.mock("./components/CancelHealthEventModal", () => ({
  default: (props: { isOpen: boolean; onConfirm: (notes: string) => void }) =>
    props.isOpen ? <button data-testid="cancel-confirm" onClick={() => props.onConfirm("notes")}>confirm cancel</button> : null,
}));

vi.mock("./components/ReopenHealthEventModal", () => ({
  default: (props: { isOpen: boolean; onConfirm: () => void }) =>
    props.isOpen ? <button data-testid="reopen-confirm" onClick={props.onConfirm}>confirm reopen</button> : null,
}));

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

const scheduledEvent = {
  id: 7,
  status: "AGENDADO",
  type: "VACINA",
  scheduledDate: "2026-09-20",
  title: "Vacinação",
  description: "",
  overdue: false,
};

const doneEvent = { ...scheduledEvent, status: "REALIZADO" };

async function renderPage(root: Root) {
  await act(async () => {
    root.render(<HealthEventDetailPage />);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("HealthEventDetailPage loader contract", () => {
  let root: Root;

  beforeEach(() => {
    mocks.getById.mockReset();
    mocks.markAsDone.mockReset().mockResolvedValue(undefined);
    mocks.cancel.mockReset().mockResolvedValue(undefined);
    mocks.reopen.mockReset().mockResolvedValue(undefined);
    mocks.fetchGoatById.mockReset().mockResolvedValue({});
    mocks.getById.mockResolvedValue(scheduledEvent);
    const container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.innerHTML = "";
  });

  it("loads the event and goat using the route identifiers without an effect loop", async () => {
    await renderPage(root);
    expect(mocks.fetchGoatById).toHaveBeenCalledWith(19, "1400800001");
    expect(mocks.getById).toHaveBeenCalledWith(19, "1400800001", 7);
    expect(mocks.getById).toHaveBeenCalledTimes(1);
  });

  it("reloads through the same loader after complete and cancel", async () => {
    await renderPage(root);
    await act(async () => {
      (document.querySelector(".health-btn-success") as HTMLElement | null)?.click();
    });
    await act(async () => {
      (document.querySelector('[data-testid="done-confirm"]') as HTMLElement | null)?.click();
    });
    expect(mocks.markAsDone).toHaveBeenCalledWith(19, "1400800001", 7, {});
    expect(mocks.getById).toHaveBeenCalledTimes(2);

    await act(async () => {
      (document.querySelector(".health-btn-danger") as HTMLElement | null)?.click();
    });
    await act(async () => {
      (document.querySelector('[data-testid="cancel-confirm"]') as HTMLElement | null)?.click();
    });
    expect(mocks.cancel).toHaveBeenCalledWith(19, "1400800001", 7, { notes: "notes" });
    expect(mocks.getById).toHaveBeenCalledTimes(3);
  });

  it("reloads after reopen", async () => {
    mocks.getById.mockResolvedValue(doneEvent);
    await renderPage(root);
    await act(async () => {
      (document.querySelector(".health-btn-warning") as HTMLElement | null)?.click();
    });
    await act(async () => {
      (document.querySelector('[data-testid="reopen-confirm"]') as HTMLElement | null)?.click();
    });
    expect(mocks.reopen).toHaveBeenCalledWith(19, "1400800001", 7);
    expect(mocks.getById).toHaveBeenCalledTimes(2);
  });
});

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import {
  createInventoryIdempotencyKey,
  createInventoryItem,
  createInventoryLot,
  createInventoryMovement,
  createInventoryPayloadHash,
  listInventoryBalances,
  listInventoryItems,
  listInventoryLots,
  listInventoryMovements,
  updateInventoryLotActive,
} from "../../api/GoatFarmAPI/inventory";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import PageHeader from "../../Components/pages-headers/PageHeader";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  Table,
} from "../../Components/ui";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { usePermissions } from "../../Hooks/usePermissions";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type {
  InventoryAdjustDirection,
  InventoryBalance,
  InventoryItem,
  InventoryLot,
  InventoryMovementCommandResult,
  InventoryMovementCreateRequestDTO,
  InventoryMovementHistoryEntry,
  InventoryMovementType,
  InventoryPageMetadata,
} from "../../Models/InventoryDTOs";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import {
  clearInventoryRetrySnapshot,
  createInventoryRetrySnapshot,
  isSameInventoryRetryPayload,
  loadInventoryRetrySnapshot,
  saveInventoryRetrySnapshot,
  syncInventoryDraftKey,
  type InventoryRetrySnapshot,
} from "./inventoryRetry";
import {
  buildInitialForm,
  buildInitialItemForm,
  buildInitialLotForm,
  buildPayloadFromForm,
  hasInvalidDateRange,
  INVENTORY_TECHNICAL_DETAILS_DEFAULT_OPEN,
  mapPayloadToForm,
  validateInventoryItemPayload,
  validateInventoryLotPayload,
  type InventoryFormState,
  type InventoryItemFormState,
  type InventoryLotFormState,
} from "./inventoryPageState";

type FieldError = {
  fieldName?: string;
  message: string;
};

type InventoryTab = "move" | "balances" | "history";

type BalanceFiltersState = {
  itemId: string;
  lotId: string;
  page: number;
};

type HistorySortValue = "movementDate,desc" | "movementDate,asc";

type HistoryFiltersState = {
  itemId: string;
  lotId: string;
  type: "" | InventoryMovementType;
  fromDate: string;
  toDate: string;
  page: number;
  sort: HistorySortValue;
};

const MOVEMENT_OPTIONS: Array<{ value: InventoryMovementType; label: string }> = [
  { value: "IN", label: "Entrada" },
  { value: "OUT", label: "SaÃƒÆ’Ã‚Â­da" },
  { value: "ADJUST", label: "Ajuste" },
];

const ADJUST_OPTIONS: Array<{ value: InventoryAdjustDirection; label: string }> = [
  { value: "INCREASE", label: "Aumentar saldo" },
  { value: "DECREASE", label: "Reduzir saldo" },
];

const HISTORY_SORT_OPTIONS: Array<{ value: HistorySortValue; label: string }> = [
  { value: "movementDate,desc", label: "Mais recentes primeiro" },
  { value: "movementDate,asc", label: "Mais antigas primeiro" },
];

const ITEMS_PAGE_SIZE = 100;
const LOTS_PAGE_SIZE = 100;
const BALANCES_PAGE_SIZE = 10;
const MOVEMENTS_PAGE_SIZE = 10;

const formatDateTime = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
};

const formatDecimal = (value?: number): string => {
  if (value == null) {
    return "-";
  }

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

const parseOptionalPositiveInteger = (value: string): number | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

const sortItemsByName = (items: InventoryItem[]): InventoryItem[] =>
  [...items].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

const sortLotsByCode = (lots: InventoryLot[]): InventoryLot[] =>
  [...lots].sort((left, right) => left.code.localeCompare(right.code, "pt-BR"));

const formatLotLabel = (lot: InventoryLot): string => {
  const fragments = [lot.code];

  if (lot.description?.trim()) {
    fragments.push(lot.description.trim());
  }

  if (lot.expirationDate) {
    fragments.push(`validade ${lot.expirationDate}`);
  }

  return fragments.join(" ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ ");
};

export type InventoryLotSelectorFieldProps = {
  selectedTrackLot: boolean;
  selectedItemId: string;
  selectedItemLots: InventoryLot[];
  selectedItemAllLotsCount: number;
  loadingLots: boolean;
  canManageInventory: boolean;
  submitting: boolean;
  formLotId: string;
  hasError: boolean;
  feedback: ReactNode;
  onOpenCreateLot: () => void;
  onChange: (nextLotId: string) => void;
};

export function InventoryLotSelectorField({
  selectedTrackLot,
  selectedItemId,
  selectedItemLots,
  selectedItemAllLotsCount,
  loadingLots,
  canManageInventory,
  submitting,
  formLotId,
  hasError,
  feedback,
  onOpenCreateLot,
  onChange,
}: InventoryLotSelectorFieldProps) {
  if (!selectedTrackLot) {
    return null;
  }

  return (
    <div className="col-12">
      <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <label className="form-label mb-0">Lote (obrigatÃƒÆ’Ã‚Â³rio)</label>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCreateLot}
          disabled={!canManageInventory || !selectedItemId}
        >
          Cadastrar lote
        </Button>
      </div>
      <select
        className={`form-select mt-2 ${hasError ? "is-invalid" : ""}`}
        value={formLotId}
        onChange={(event) => onChange(event.target.value)}
        disabled={submitting || !canManageInventory || loadingLots || selectedItemLots.length === 0}
      >
        <option value="">
          {loadingLots
            ? "Carregando lotes..."
            : selectedItemLots.length === 0
              ? "Nenhum lote ativo para este produto"
              : "Selecione um lote"}
        </option>
        {selectedItemLots.map((lot) => (
          <option key={lot.id} value={lot.id}>
            {formatLotLabel(lot)}
          </option>
        ))}
      </select>
      {feedback}
      <div className="form-text">
        {selectedItemLots.length === 0
          ? "Cadastre e mantenha um lote ativo para registrar movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes deste produto."
          : `${selectedItemAllLotsCount} lote(s) cadastrado(s) e ${selectedItemLots.length} ativo(s) disponÃƒÆ’Ã‚Â­vel(is) para movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.`}
      </div>
    </div>
  );
}

export type InventoryLotManagementCardProps = {
  selectedItem: InventoryItem | null;
  selectedTrackLot: boolean;
  lotsPageTotal?: number;
  selectedItemAllLots: InventoryLot[];
  lotsError: string | null;
  loadingLots: boolean;
  canManageInventory: boolean;
  updatingLotId: number | null;
  onOpenCreateLot: () => void;
  onRetryLots: () => void;
  onToggleLotActive: (lot: InventoryLot) => void;
};

export function InventoryLotManagementCard({
  selectedItem,
  selectedTrackLot,
  lotsPageTotal,
  selectedItemAllLots,
  lotsError,
  loadingLots,
  canManageInventory,
  updatingLotId,
  onOpenCreateLot,
  onRetryLots,
  onToggleLotActive,
}: InventoryLotManagementCardProps) {
  return (
    <Card
      title="Lotes do produto selecionado"
      description={
        selectedTrackLot
          ? "Cadastre, acompanhe e alterne o status dos lotes usados neste produto."
          : "Selecione um produto com controle por lote para gerenciar seus lotes."
      }
      actions={
        selectedTrackLot ? (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {lotsPageTotal != null && (
              <span className="badge text-bg-light">{lotsPageTotal} lote(s) na fazenda</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCreateLot}
              disabled={!canManageInventory || !selectedItem}
            >
              Novo lote
            </Button>
          </div>
        ) : undefined
      }
    >
      {!selectedItem ? (
        <EmptyState
          title="Selecione um produto"
          description="Escolha um produto para consultar ou cadastrar lotes."
        />
      ) : !selectedTrackLot ? (
        <EmptyState
          title="Produto sem controle por lote"
          description="Este produto nÃƒÆ’Ã‚Â£o exige lote e, por isso, nÃƒÆ’Ã‚Â£o tem gerenciamento de lotes."
        />
      ) : lotsError ? (
        <ErrorState
          title="NÃƒÆ’Ã‚Â£o foi possÃƒÆ’Ã‚Â­vel carregar os lotes"
          description={lotsError}
          onRetry={onRetryLots}
        />
      ) : loadingLots ? (
        <LoadingState label="Carregando lotes..." />
      ) : selectedItemAllLots.length === 0 ? (
        <EmptyState
          title="Nenhum lote cadastrado"
          description="Cadastre o primeiro lote para este produto e use-o nas movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes."
        />
      ) : (
        <div className="d-grid gap-2">
          {selectedItemAllLots.map((lot) => (
            <div
              key={`lot-management-${lot.id}`}
              className="border rounded-3 p-3 d-flex justify-content-between align-items-start gap-3 flex-wrap"
            >
              <div>
                <div className="fw-semibold">{formatLotLabel(lot)}</div>
                <div className="small text-muted">
                  ID {lot.id} ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ {lot.active ? "ativo" : "inativo"}
                </div>
              </div>
              <Button
                variant={lot.active ? "secondary" : "primary"}
                size="sm"
                onClick={() => onToggleLotActive(lot)}
                disabled={!canManageInventory || updatingLotId === lot.id}
                loading={updatingLotId === lot.id}
              >
                {lot.active ? "Inativar" : "Ativar"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function InventoryPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const { canCreateGoat, loading: loadingPermissions } = useFarmPermissions(
    Number.isNaN(farmIdNumber) ? undefined : farmIdNumber
  );

  const [activeTab, setActiveTab] = useState<InventoryTab>("move");
  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemsPage, setItemsPage] = useState<InventoryPageMetadata | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [form, setForm] = useState<InventoryFormState>(buildInitialForm);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [lastCommand, setLastCommand] = useState<InventoryMovementCommandResult | null>(null);
  const [draftKey, setDraftKey] = useState<string | null>(createInventoryIdempotencyKey());
  const [draftPayloadHash, setDraftPayloadHash] = useState<string | null>(null);
  const [retrySnapshot, setRetrySnapshot] = useState<InventoryRetrySnapshot | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(
    INVENTORY_TECHNICAL_DETAILS_DEFAULT_OPEN
  );

  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState<InventoryItemFormState>(buildInitialItemForm);
  const [creatingItem, setCreatingItem] = useState(false);
  const [createItemError, setCreateItemError] = useState<string | null>(null);
  const [createItemFieldErrors, setCreateItemFieldErrors] = useState<FieldError[]>([]);

  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [lotsPage, setLotsPage] = useState<InventoryPageMetadata | null>(null);
  const [loadingLots, setLoadingLots] = useState(false);
  const [lotsError, setLotsError] = useState<string | null>(null);
  const [isCreateLotModalOpen, setIsCreateLotModalOpen] = useState(false);
  const [lotForm, setLotForm] = useState<InventoryLotFormState>(buildInitialLotForm);
  const [creatingLot, setCreatingLot] = useState(false);
  const [createLotError, setCreateLotError] = useState<string | null>(null);
  const [createLotFieldErrors, setCreateLotFieldErrors] = useState<FieldError[]>([]);
  const [updatingLotId, setUpdatingLotId] = useState<number | null>(null);
  const [lotsReloadVersion, setLotsReloadVersion] = useState(0);

  const [balanceFilters, setBalanceFilters] = useState<BalanceFiltersState>({
    itemId: "",
    lotId: "",
    page: 0,
  });
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [balancesPage, setBalancesPage] = useState<InventoryPageMetadata | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [balancesError, setBalancesError] = useState<string | null>(null);

  const [historyFilters, setHistoryFilters] = useState<HistoryFiltersState>({
    itemId: "",
    lotId: "",
    type: "",
    fromDate: "",
    toDate: "",
    page: 0,
    sort: "movementDate,desc",
  });
  const [movements, setMovements] = useState<InventoryMovementHistoryEntry[]>([]);
  const [movementsPage, setMovementsPage] = useState<InventoryPageMetadata | null>(null);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementsError, setMovementsError] = useState<string | null>(null);

  const canManageInventory = permissions.isAdmin() || canCreateGoat;

  const selectedItem = useMemo(
    () => items.find((entry) => `${entry.id}` === selectedItemId) ?? null,
    [items, selectedItemId]
  );
  const selectedTrackLot = selectedItem?.trackLot ?? false;
  const lotById = useMemo(
    () =>
      new Map(
        lots.map((entry) => [entry.id, entry] as const)
      ),
    [lots]
  );
  const selectedItemLots = useMemo(
    () =>
      sortLotsByCode(
        lots.filter((entry) => `${entry.itemId}` === selectedItemId && entry.active)
      ),
    [lots, selectedItemId]
  );
  const selectedItemAllLots = useMemo(
    () => sortLotsByCode(lots.filter((entry) => `${entry.itemId}` === selectedItemId)),
    [lots, selectedItemId]
  );
  const balanceAvailableLots = useMemo(
    () =>
      sortLotsByCode(
        lots.filter((entry) =>
          balanceFilters.itemId ? `${entry.itemId}` === balanceFilters.itemId : true
        )
      ),
    [lots, balanceFilters.itemId]
  );
  const historyAvailableLots = useMemo(
    () =>
      sortLotsByCode(
        lots.filter((entry) =>
          historyFilters.itemId ? `${entry.itemId}` === historyFilters.itemId : true
        )
      ),
    [lots, historyFilters.itemId]
  );
  const getLotDisplay = (lotId?: number | null): string => {
    if (lotId == null) {
      return "-";
    }

    const lot = lotById.get(lotId);
    return lot ? formatLotLabel(lot) : `#${lotId}`;
  };

  const resetRetryState = () => {
    if (!Number.isNaN(farmIdNumber)) {
      clearInventoryRetrySnapshot(farmIdNumber);
    }
    setRetrySnapshot(null);
  };

  const syncDraftFromPayload = (
    payload: InventoryMovementCreateRequestDTO,
    forceNewKey = false
  ): { idempotencyKey: string; payloadHash: string } => {
    if (forceNewKey) {
      const nextKey = createInventoryIdempotencyKey();
      const nextHash = createInventoryPayloadHash(payload);
      setDraftKey(nextKey);
      setDraftPayloadHash(nextHash);
      return { idempotencyKey: nextKey, payloadHash: nextHash };
    }

    const nextDraft = syncInventoryDraftKey({
      currentKey: draftKey,
      currentPayloadHash: draftPayloadHash,
      nextPayload: payload,
    });

    setDraftKey(nextDraft.idempotencyKey);
    setDraftPayloadHash(nextDraft.payloadHash);

    return {
      idempotencyKey: nextDraft.idempotencyKey,
      payloadHash: nextDraft.payloadHash,
    };
  };

  const syncDraftStateAfterChange = (
    nextForm: InventoryFormState,
    nextSelectedItemId: string,
    nextSelectedTrackLot: boolean
  ) => {
    const built = buildPayloadFromForm({
      form: nextForm,
      selectedItemId: nextSelectedItemId,
      selectedTrackLot: nextSelectedTrackLot,
    });

    if (retrySnapshot) {
      if (!built.payload || !isSameInventoryRetryPayload(retrySnapshot, built.payload)) {
        resetRetryState();
        if (built.payload) {
          syncDraftFromPayload(built.payload, true);
        } else {
          setDraftKey(createInventoryIdempotencyKey());
          setDraftPayloadHash(null);
        }
        return;
      }
    }

    if (built.payload) {
      syncDraftFromPayload(built.payload);
    } else if (!draftKey) {
      setDraftKey(createInventoryIdempotencyKey());
      setDraftPayloadHash(null);
    }
  };

  const getFieldMessages = (fieldName: string): string[] =>
    fieldErrors
      .filter((entry) => entry.fieldName === fieldName)
      .map((entry) => entry.message);

  const getFriendlyFieldName = (fieldName?: string): string | null => {
    switch (fieldName) {
      case "itemId":
        return "Produto";
      case "lotId":
        return "Lote";
      case "movementDate":
        return "Data da movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o";
      case "adjustDirection":
        return "DireÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do ajuste";
      case "quantity":
        return "Quantidade";
      default:
        return fieldName ?? null;
    }
  };

  const renderFieldFeedback = (fieldName: string) => {
    const messages = getFieldMessages(fieldName);

    if (messages.length === 0) {
      return null;
    }

    return <div className="invalid-feedback d-block">{messages.join(" ")}</div>;
  };

  const getCreateItemMessages = (fieldName: string): string[] =>
    createItemFieldErrors
      .filter((entry) => entry.fieldName === fieldName)
      .map((entry) => entry.message);

  const renderCreateItemFeedback = (fieldName: string) => {
    const messages = getCreateItemMessages(fieldName);

    if (messages.length === 0) {
      return null;
    }

    return <div className="invalid-feedback d-block">{messages.join(" ")}</div>;
  };

  const getCreateLotMessages = (fieldName: string): string[] =>
    createLotFieldErrors
      .filter((entry) => entry.fieldName === fieldName)
      .map((entry) => entry.message);

  const renderCreateLotFeedback = (fieldName: string) => {
    const messages = getCreateLotMessages(fieldName);

    if (messages.length === 0) {
      return null;
    }

    return <div className="invalid-feedback d-block">{messages.join(" ")}</div>;
  };

  const updateField = <K extends keyof InventoryFormState>(
    key: K,
    value: InventoryFormState[K]
  ) => {
    const nextForm = {
      ...form,
      [key]: value,
    } as InventoryFormState;

    if (key === "type" && value !== "ADJUST") {
      nextForm.adjustDirection = "";
    }

    setForm(nextForm);
    setSubmitError(null);
    setFieldErrors([]);
    syncDraftStateAfterChange(nextForm, selectedItemId, selectedTrackLot);
  };

  const updateSelectedItem = (nextSelectedItemId: string) => {
    const nextSelectedItem =
      items.find((entry) => `${entry.id}` === nextSelectedItemId) ?? null;
    const nextSelectedTrackLot = nextSelectedItem?.trackLot ?? false;
    const nextForm = nextSelectedTrackLot ? form : { ...form, lotId: "" };

    setSelectedItemId(nextSelectedItemId);
    setForm(nextForm);
    setSubmitError(null);
    setFieldErrors([]);
    syncDraftStateAfterChange(nextForm, nextSelectedItemId, nextSelectedTrackLot);
  };

  const updateBalanceFilters = (next: Partial<BalanceFiltersState>) => {
    setBalanceFilters((current) => ({
      ...current,
      ...next,
      page: next.page ?? (next.itemId != null || next.lotId != null ? 0 : current.page),
    }));
  };

  const updateHistoryFilters = (next: Partial<HistoryFiltersState>) => {
    setHistoryFilters((current) => ({
      ...current,
      ...next,
      page:
        next.page ??
        (next.itemId != null ||
        next.lotId != null ||
        next.type != null ||
        next.fromDate != null ||
        next.toDate != null ||
        next.sort != null
          ? 0
          : current.page),
    }));
  };

  useEffect(() => {
    if (!selectedItemId || selectedTrackLot) {
      return;
    }

    setForm((current) => (current.lotId ? { ...current, lotId: "" } : current));
  }, [selectedItemId, selectedTrackLot]);

  useEffect(() => {
    if (!selectedTrackLot || !form.lotId) {
      return;
    }

    const existsInSelectedItem = selectedItemLots.some((entry) => `${entry.id}` === form.lotId);
    if (!existsInSelectedItem) {
      const nextForm = { ...form, lotId: "" };
      setForm(nextForm);
      syncDraftStateAfterChange(nextForm, selectedItemId, selectedTrackLot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemLots, selectedTrackLot, form, selectedItemId]);

  useEffect(() => {
    if (Number.isNaN(farmIdNumber)) {
      return;
    }

    getGoatFarmById(farmIdNumber)
      .then(setFarmData)
      .catch((error) => {
        console.error("Erro ao carregar dados da fazenda para inventory", error);
      });
  }, [farmIdNumber]);

  useEffect(() => {
    if (Number.isNaN(farmIdNumber)) {
      return;
    }

    const storedRetry = loadInventoryRetrySnapshot(farmIdNumber);
    if (!storedRetry) {
      return;
    }

    setRetrySnapshot(storedRetry);
    setDraftKey(storedRetry.idempotencyKey);
    setDraftPayloadHash(storedRetry.payloadHash);
    setForm(mapPayloadToForm(storedRetry.payload));
    setSelectedItemId(`${storedRetry.payload.itemId}`);
  }, [farmIdNumber]);

  useEffect(() => {
    if (Number.isNaN(farmIdNumber)) {
      return;
    }

    let ignore = false;
    setLoadingItems(true);
    setItemsError(null);

    listInventoryItems(farmIdNumber, 0, ITEMS_PAGE_SIZE, true)
      .then((response) => {
        if (ignore) {
          return;
        }

        setItems(sortItemsByName(response.content));
        setItemsPage(response.page);
      })
      .catch((error) => {
        if (ignore) {
          return;
        }

        console.error("Erro ao listar itens de inventory", error);
        setItemsError(getApiErrorMessage(parseApiError(error)));
      })
      .finally(() => {
        if (!ignore) {
          setLoadingItems(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [farmIdNumber]);

  useEffect(() => {
    if (Number.isNaN(farmIdNumber)) {
      return;
    }

    let ignore = false;
    setLoadingLots(true);
    setLotsError(null);

    listInventoryLots(farmIdNumber, {
      page: 0,
      size: LOTS_PAGE_SIZE,
      sort: "code,asc",
    })
      .then((response) => {
        if (ignore) {
          return;
        }

        setLots(sortLotsByCode(response.content));
        setLotsPage(response.page);
      })
      .catch((error) => {
        if (ignore) {
          return;
        }

        console.error("Erro ao listar lotes de inventory", error);
        setLotsError(getApiErrorMessage(parseApiError(error)));
      })
      .finally(() => {
        if (!ignore) {
          setLoadingLots(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [farmIdNumber, lotsReloadVersion]);

  useEffect(() => {
    if (activeTab !== "balances" || Number.isNaN(farmIdNumber)) {
      return;
    }

    let ignore = false;
    setLoadingBalances(true);
    setBalancesError(null);

    listInventoryBalances(farmIdNumber, {
      itemId: parseOptionalPositiveInteger(balanceFilters.itemId),
      lotId: parseOptionalPositiveInteger(balanceFilters.lotId),
      activeOnly: true,
      page: balanceFilters.page,
      size: BALANCES_PAGE_SIZE,
    })
      .then((response) => {
        if (ignore) {
          return;
        }

        setBalances(response.content);
        setBalancesPage(response.page);
      })
      .catch((error) => {
        if (ignore) {
          return;
        }

        console.error("Erro ao consultar saldos de inventory", error);
        setBalancesError(getApiErrorMessage(parseApiError(error)));
      })
      .finally(() => {
        if (!ignore) {
          setLoadingBalances(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, balanceFilters.itemId, balanceFilters.lotId, balanceFilters.page, farmIdNumber]);

  useEffect(() => {
    if (activeTab !== "history" || Number.isNaN(farmIdNumber)) {
      return;
    }

    if (hasInvalidDateRange(historyFilters.fromDate, historyFilters.toDate)) {
      setMovements([]);
      setMovementsPage(null);
      setMovementsError("Data inicial nÃƒÆ’Ã‚Â£o pode ser maior que a data final.");
      return;
    }

    let ignore = false;
    setLoadingMovements(true);
    setMovementsError(null);

    listInventoryMovements(farmIdNumber, {
      itemId: parseOptionalPositiveInteger(historyFilters.itemId),
      lotId: parseOptionalPositiveInteger(historyFilters.lotId),
      type: historyFilters.type || undefined,
      fromDate: historyFilters.fromDate || undefined,
      toDate: historyFilters.toDate || undefined,
      page: historyFilters.page,
      size: MOVEMENTS_PAGE_SIZE,
      sort: historyFilters.sort,
    })
      .then((response) => {
        if (ignore) {
          return;
        }

        setMovements(response.content);
        setMovementsPage(response.page);
      })
      .catch((error) => {
        if (ignore) {
          return;
        }

        console.error("Erro ao consultar histÃƒÆ’Ã‚Â³rico de inventory", error);
        setMovementsError(getApiErrorMessage(parseApiError(error)));
      })
      .finally(() => {
        if (!ignore) {
          setLoadingMovements(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [
    activeTab,
    farmIdNumber,
    historyFilters.fromDate,
    historyFilters.itemId,
    historyFilters.lotId,
    historyFilters.page,
    historyFilters.sort,
    historyFilters.toDate,
    historyFilters.type,
  ]);

  const handleCreateItem = async () => {
    if (Number.isNaN(farmIdNumber)) {
      setCreateItemError("FarmId invÃƒÆ’Ã‚Â¡lido.");
      return;
    }

    const validationError = validateInventoryItemPayload(itemForm);
    if (validationError) {
      setCreateItemFieldErrors([{ fieldName: "name", message: validationError }]);
      setCreateItemError(validationError);
      return;
    }

    try {
      setCreatingItem(true);
      setCreateItemError(null);
      setCreateItemFieldErrors([]);

      const createdItem = await createInventoryItem(farmIdNumber, itemForm);
      const nextItems = sortItemsByName([
        ...items.filter((entry) => entry.id !== createdItem.id),
        createdItem,
      ]);

      setItems(nextItems);
      setItemsPage((current) =>
        current
          ? {
              ...current,
              totalElements: current.totalElements + 1,
            }
          : current
      );
      const nextSelectedItemId = `${createdItem.id}`;
      const nextSelectedTrackLot = createdItem.trackLot;
      const nextForm = nextSelectedTrackLot ? form : { ...form, lotId: "" };

      setItemForm(buildInitialItemForm());
      setIsCreateItemModalOpen(false);
      setSelectedItemId(nextSelectedItemId);
      setForm(nextForm);
      setSubmitError(null);
      setFieldErrors([]);
      syncDraftStateAfterChange(nextForm, nextSelectedItemId, nextSelectedTrackLot);
      toast.success("Produto cadastrado e selecionado com sucesso.");
    } catch (error) {
      console.error("Erro ao cadastrar item de inventory", error);
      const parsed = parseApiError(error);
      const message =
        parsed.status === 409
          ? parsed.message?.trim() || "JÃƒÆ’Ã‚Â¡ existe um item com esse nome nesta fazenda."
          : getApiErrorMessage(parsed);

      const nextFieldErrors =
        parsed.status === 400 || parsed.status === 422
          ? parsed.fieldErrors ?? []
          : parsed.status === 409
            ? [{ fieldName: "name", message }]
            : [];

      setCreateItemError(message);
      setCreateItemFieldErrors(nextFieldErrors);
    } finally {
      setCreatingItem(false);
    }
  };

  const closeCreateLotModal = () => {
    if (creatingLot) return;
    setIsCreateLotModalOpen(false);
    setCreateLotError(null);
    setCreateLotFieldErrors([]);
    setLotForm(buildInitialLotForm());
  };

  const handleCreateLot = async () => {
    if (Number.isNaN(farmIdNumber)) {
      setCreateLotError("FarmId invÃƒÆ’Ã‚Â¡lido.");
      return;
    }

    const selectedItemNumericId = parseOptionalPositiveInteger(selectedItemId);
    const canCreateForSelection = Boolean(selectedItemNumericId && selectedTrackLot);
    const validationError = validateInventoryLotPayload(lotForm, canCreateForSelection);

    if (validationError) {
      setCreateLotFieldErrors([
        {
          fieldName: canCreateForSelection ? "code" : "itemId",
          message: validationError,
        },
      ]);
      setCreateLotError(validationError);
      return;
    }

    try {
      setCreatingLot(true);
      setCreateLotError(null);
      setCreateLotFieldErrors([]);

      const createdLot = await createInventoryLot(farmIdNumber, {
        itemId: selectedItemNumericId as number,
        code: lotForm.code,
        description: lotForm.description,
        expirationDate: lotForm.expirationDate || undefined,
        active: lotForm.active,
      });

      const nextLots = sortLotsByCode([
        ...lots.filter((entry) => entry.id !== createdLot.id),
        createdLot,
      ]);
      const nextForm = createdLot.active ? { ...form, lotId: `${createdLot.id}` } : { ...form, lotId: "" };

      setLots(nextLots);
      setLotsPage((current) =>
        current
          ? {
              ...current,
              totalElements: current.totalElements + 1,
            }
          : {
              number: 0,
              size: LOTS_PAGE_SIZE,
              totalElements: nextLots.length,
              totalPages: 1,
            }
      );
      setForm(nextForm);
      setIsCreateLotModalOpen(false);
      setLotForm(buildInitialLotForm());
      setSubmitError(null);
      setFieldErrors([]);
      syncDraftStateAfterChange(nextForm, selectedItemId, selectedTrackLot);
      toast.success(
        createdLot.active
          ? "Lote cadastrado e selecionado com sucesso."
          : "Lote cadastrado com sucesso. Ative-o para usÃƒÆ’Ã‚Â¡-lo em movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes."
      );
    } catch (error) {
      console.error("Erro ao cadastrar lote de inventory", error);
      const parsed = parseApiError(error);
      const message =
        parsed.status === 409
          ? parsed.message?.trim() || "JÃƒÆ’Ã‚Â¡ existe um lote com esse cÃƒÆ’Ã‚Â³digo para este produto."
          : getApiErrorMessage(parsed);

      const nextFieldErrors =
        parsed.status === 400 || parsed.status === 422
          ? parsed.fieldErrors ?? []
          : parsed.status === 409
            ? [{ fieldName: "code", message }]
            : [];

      setCreateLotError(message);
      setCreateLotFieldErrors(nextFieldErrors);
    } finally {
      setCreatingLot(false);
    }
  };

  const handleToggleLotActive = async (lot: InventoryLot) => {
    if (Number.isNaN(farmIdNumber)) {
      toast.error("FarmId invÃƒÆ’Ã‚Â¡lido.");
      return;
    }

    try {
      setUpdatingLotId(lot.id);

      const updatedLot = await updateInventoryLotActive(farmIdNumber, lot.id, {
        active: !lot.active,
      });

      const nextLots = sortLotsByCode(
        lots.map((entry) => (entry.id === updatedLot.id ? updatedLot : entry))
      );
      setLots(nextLots);

      if (!updatedLot.active && form.lotId === `${updatedLot.id}`) {
        const nextForm = { ...form, lotId: "" };
        setForm(nextForm);
        syncDraftStateAfterChange(nextForm, selectedItemId, selectedTrackLot);
      }

      toast.success(updatedLot.active ? "Lote ativado com sucesso." : "Lote inativado com sucesso.");
    } catch (error) {
      console.error("Erro ao atualizar status do lote", error);
      toast.error(getApiErrorMessage(parseApiError(error)));
    } finally {
      setUpdatingLotId(null);
    }
  };

  const handleSubmit = async (mode: "create" | "retry" = "create") => {
    if (Number.isNaN(farmIdNumber)) {
      setSubmitError("FarmId invÃƒÆ’Ã‚Â¡lido.");
      return;
    }

    const built = buildPayloadFromForm({
      form,
      selectedItemId,
      selectedTrackLot,
    });

    if (!built.payload) {
      setSubmitError(built.error ?? "Revise os dados da movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.");
      return;
    }

    if (
      mode === "retry" &&
      retrySnapshot &&
      !isSameInventoryRetryPayload(retrySnapshot, built.payload)
    ) {
      resetRetryState();
      syncDraftFromPayload(built.payload, true);
      setSubmitError("Os dados foram alterados. Gere um novo envio antes de reenviar.");
      return;
    }

    const preparedDraft =
      mode === "retry" && retrySnapshot
        ? {
            idempotencyKey: retrySnapshot.idempotencyKey,
            payloadHash: retrySnapshot.payloadHash,
          }
        : syncDraftFromPayload(built.payload);

    try {
      setSubmitting(true);
      setSubmitError(null);
      setFieldErrors([]);

      const result = await createInventoryMovement(farmIdNumber, built.payload, {
        idempotencyKey: preparedDraft.idempotencyKey,
      });

      setLastCommand(result);
      setShowTechnicalDetails(INVENTORY_TECHNICAL_DETAILS_DEFAULT_OPEN);
      resetRetryState();

      const nextForm = {
        ...buildInitialForm(),
        type: form.type,
        lotId: selectedTrackLot ? form.lotId : "",
      };

      setForm(nextForm);
      const nextBuilt = buildPayloadFromForm({
        form: nextForm,
        selectedItemId,
        selectedTrackLot,
      });

      if (nextBuilt.payload) {
        syncDraftFromPayload(nextBuilt.payload, true);
      } else {
        setDraftKey(createInventoryIdempotencyKey());
        setDraftPayloadHash(null);
      }

      toast.success(
        result.responseStatus === 200
          ? "O sistema reconheceu este reenvio e evitou duplicidade."
          : "MovimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o registrada com sucesso."
      );
    } catch (error) {
      console.error("Erro ao registrar movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de inventory", error);
      const parsed = parseApiError(error);

      if (!parsed.status) {
        const snapshot = createInventoryRetrySnapshot(
          farmIdNumber,
          built.payload,
          preparedDraft.idempotencyKey
        );
        saveInventoryRetrySnapshot(snapshot);
        setRetrySnapshot(snapshot);
        setDraftKey(snapshot.idempotencyKey);
        setDraftPayloadHash(snapshot.payloadHash);
        setSubmitError(
          "Falha de rede ou tempo de resposta esgotado. VocÃƒÆ’Ã‚Âª pode reenviar com seguranÃƒÆ’Ã‚Â§a sem duplicar a movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o."
        );
        toast.warning("Falha de rede. Use ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œReenviarÃƒÂ¢Ã¢â€šÂ¬Ã‚Â para tentar novamente com seguranÃƒÆ’Ã‚Â§a.");
        return;
      }

      resetRetryState();

      const message =
        parsed.status === 409
            ? "Este envio entrou em conflito com uma tentativa anterior. Revise os dados e tente novamente."
          : parsed.status === 403
            ? "Sem permissÃƒÆ’Ã‚Â£o para registrar movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes nesta fazenda."
            : parsed.status === 422 &&
                Boolean(parsed.message?.toLowerCase()?.includes("saldo"))
              ? "Saldo insuficiente para esta saÃƒÆ’Ã‚Â­da."
            : getApiErrorMessage(parsed);

      if (parsed.status === 409) {
        syncDraftFromPayload(built.payload, true);
      }

      setSubmitError(message);
      setFieldErrors(
        parsed.status === 400 || parsed.status === 422 ? parsed.fieldErrors ?? [] : []
      );
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (Number.isNaN(farmIdNumber)) {
    return (
      <div className="gf-container">
        <div className="mt-5">
          <ErrorState
            title="Fazenda invÃƒÆ’Ã‚Â¡lida"
            description="NÃƒÆ’Ã‚Â£o foi possÃƒÆ’Ã‚Â­vel identificar a fazenda para abrir o mÃƒÆ’Ã‚Â³dulo de estoque."
            retryLabel="Voltar para fazendas"
            onRetry={() => navigate("/goatfarms")}
          />
        </div>
      </div>
    );
  }

  const responseBadgeClass =
    lastCommand?.responseStatus === 200 ? "text-bg-info" : "text-bg-success";
  const responseBadgeLabel =
    lastCommand?.responseStatus === 200 ? "Repetido (idempotÃƒÆ’Ã‚Âªncia)" : "Criado";
  const canGoToPreviousBalancesPage = (balancesPage?.number ?? 0) > 0;
  const canGoToNextBalancesPage =
    balancesPage != null && balancesPage.number + 1 < balancesPage.totalPages;
  const canGoToPreviousHistoryPage = (movementsPage?.number ?? 0) > 0;
  const canGoToNextHistoryPage =
    movementsPage != null && movementsPage.number + 1 < movementsPage.totalPages;

  const closeCreateItemModal = () => {
    if (creatingItem) return;
    setIsCreateItemModalOpen(false);
    setCreateItemError(null);
    setCreateItemFieldErrors([]);
    setItemForm(buildInitialItemForm());
  };

  return (
    <div className="gf-container py-4">
      <GoatFarmHeader
        name={farmData?.name || "Capril"}
        logoUrl={farmData?.logoUrl}
        farmId={farmIdNumber}
      />

      <PageHeader
        title="Estoque"
        description="Consulte saldos, acompanhe o histÃƒÆ’Ã‚Â³rico e registre movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes desta fazenda."
        showBackButton={true}
        backButtonUrl="/goatfarms"
      />

      <div className="mt-3">
        <Card>
          <div className="d-flex flex-wrap gap-2" role="tablist" aria-label="NavegaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do estoque">
            <Button
              variant={activeTab === "move" ? "primary" : "outline"}
              onClick={() => setActiveTab("move")}
            >
              Movimentar
            </Button>
            <Button
              variant={activeTab === "balances" ? "primary" : "outline"}
              onClick={() => setActiveTab("balances")}
            >
              Saldos
            </Button>
            <Button
              variant={activeTab === "history" ? "primary" : "outline"}
              onClick={() => setActiveTab("history")}
            >
              HistÃƒÆ’Ã‚Â³rico
            </Button>
          </div>
        </Card>
      </div>

      {activeTab === "move" && <div className="row g-4 mt-1 align-items-start">
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h3 className="h5 mb-1">Nova movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o</h3>
                  <p className="text-muted mb-0">
                    Registre entradas, saÃƒÆ’Ã‚Â­das e ajustes do estoque desta fazenda.
                  </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  {!canManageInventory && !loadingPermissions && (
                    <span className="badge text-bg-warning">Somente leitura</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreateItemModalOpen(true);
                      setCreateItemError(null);
                      setCreateItemFieldErrors([]);
                    }}
                    disabled={!canManageInventory}
                  >
                    Cadastrar produto
                  </Button>
                </div>
              </div>

              {submitError && (
                <div className="alert alert-danger" role="alert">
                  {submitError}
                </div>
              )}

              {itemsError && (
                <div className="alert alert-warning" role="alert">
                  {itemsError}
                </div>
              )}

              {lotsError && (
                <div className="alert alert-warning" role="alert">
                  <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                    <span>{lotsError}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setLotsReloadVersion((current) => current + 1)}
                      disabled={loadingLots}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              )}

              {retrySnapshot && (
                <div className="alert alert-warning" role="alert">
                  <strong>Reenvio disponÃƒÆ’Ã‚Â­vel:</strong> a mesma chave de envio serÃƒÆ’Ã‚Â¡ reutilizada
                  se vocÃƒÆ’Ã‚Âª clicar em <strong>Reenviar</strong> sem alterar o payload.
                </div>
              )}

              {fieldErrors.length > 0 && (
                <div className="alert alert-warning" role="alert">
                  <strong>Campos com erro:</strong>
                  <ul className="mb-0 mt-2 ps-3">
                    {fieldErrors.map((entry, index) => (
                      <li key={`${entry.fieldName || "field"}-${index}`}>
                        {getFriendlyFieldName(entry.fieldName)
                          ? `${getFriendlyFieldName(entry.fieldName)}: `
                          : ""}
                        {entry.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <label className="form-label mb-0">Produto</label>
                    <span className="small text-muted">
                      {loadingItems
                        ? "Carregando produtos..."
                        : `${items.length} produto(s) carregado(s)${
                            itemsPage ? ` de ${itemsPage.totalElements}` : ""
                          }`}
                    </span>
                  </div>
                  <select
                    className={`form-select mt-2 ${
                      getFieldMessages("itemId").length ? "is-invalid" : ""
                    }`}
                    value={selectedItemId}
                    onChange={(event) => updateSelectedItem(event.target.value)}
                    disabled={submitting || !canManageInventory || loadingItems}
                  >
                    <option value="">
                      {loadingItems ? "Carregando produtos..." : "Selecione um produto"}
                    </option>
                    {selectedItemId && !selectedItem && (
                      <option value={selectedItemId}>
                        Produto selecionado (atualizando lista)
                      </option>
                    )}
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.trackLot ? " (controla lote)" : ""}
                      </option>
                    ))}
                  </select>
                  {renderFieldFeedback("itemId")}
                  {selectedItem && (
                    <div className="mt-2 d-flex gap-2 flex-wrap">
                      <span className={`badge ${selectedTrackLot ? "text-bg-primary" : "text-bg-light"}`}>
                        {selectedTrackLot ? "Controle por lote" : "Sem controle por lote"}
                      </span>
                      {selectedTrackLot && (
                        <span className="badge text-bg-light">
                          {loadingLots
                            ? "Carregando lotes..."
                            : `${selectedItemAllLots.length} lote(s) cadastrado(s)`}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Tipo</label>
                  <select
                    className={`form-select ${getFieldMessages("type").length ? "is-invalid" : ""}`}
                    value={form.type}
                    onChange={(event) =>
                      updateField("type", event.target.value as InventoryMovementType)
                    }
                    disabled={submitting || !canManageInventory}
                  >
                    {MOVEMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {renderFieldFeedback("type")}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Quantidade</label>
                  <input
                    className={`form-control ${getFieldMessages("quantity").length ? "is-invalid" : ""}`}
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={form.quantity}
                    onChange={(event) => updateField("quantity", event.target.value)}
                    disabled={submitting || !canManageInventory}
                    placeholder="Ex.: 2,500"
                  />
                  {renderFieldFeedback("quantity")}
                </div>

                <InventoryLotSelectorField
                  selectedTrackLot={selectedTrackLot}
                  selectedItemId={selectedItemId}
                  selectedItemLots={selectedItemLots}
                  selectedItemAllLotsCount={selectedItemAllLots.length}
                  loadingLots={loadingLots}
                  canManageInventory={canManageInventory}
                  submitting={submitting}
                  formLotId={form.lotId}
                  hasError={getFieldMessages("lotId").length > 0}
                  feedback={renderFieldFeedback("lotId")}
                  onOpenCreateLot={() => {
                    setLotForm(buildInitialLotForm());
                    setCreateLotError(null);
                    setCreateLotFieldErrors([]);
                    setIsCreateLotModalOpen(true);
                  }}
                  onChange={(nextLotId) => updateField("lotId", nextLotId)}
                />

                {form.type === "ADJUST" && (
                  <div className="col-12">
                    <label className="form-label">DireÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o do ajuste</label>
                    <select
                      className={`form-select ${
                        getFieldMessages("adjustDirection").length ? "is-invalid" : ""
                      }`}
                      value={form.adjustDirection}
                      onChange={(event) =>
                        updateField(
                          "adjustDirection",
                          event.target.value as InventoryAdjustDirection | ""
                        )
                      }
                      disabled={submitting || !canManageInventory}
                    >
                      <option value="">Selecione</option>
                      {ADJUST_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {renderFieldFeedback("adjustDirection")}
                  </div>
                )}

                <div className="col-12 col-md-6">
                  <label className="form-label">Data da movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o</label>
                  <input
                    className={`form-control ${
                      getFieldMessages("movementDate").length ? "is-invalid" : ""
                    }`}
                    type="date"
                    value={form.movementDate}
                    onChange={(event) => updateField("movementDate", event.target.value)}
                    disabled={submitting || !canManageInventory}
                  />
                  {renderFieldFeedback("movementDate")}
                </div>

                <div className="col-12">
                  <label className="form-label">Motivo / observaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o</label>
                  <textarea
                    className={`form-control ${getFieldMessages("reason").length ? "is-invalid" : ""}`}
                    rows={3}
                    maxLength={500}
                    value={form.reason}
                    onChange={(event) => updateField("reason", event.target.value)}
                    disabled={submitting || !canManageInventory}
                    placeholder="Ex.: Baixa por aplicaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o sanitÃƒÆ’Ã‚Â¡ria"
                  />
                  {renderFieldFeedback("reason")}
                </div>
              </div>

              <div className="d-flex gap-2 flex-wrap mt-4">
                <Button
                  variant="primary"
                  onClick={() => void handleSubmit("create")}
                  disabled={submitting || !canManageInventory || !selectedItemId || loadingItems}
                  loading={submitting}
                >
                  {submitting ? "Enviando..." : "Registrar movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o"}
                </Button>
                {retrySnapshot && (
                  <Button
                    variant="warning"
                    onClick={() => void handleSubmit("retry")}
                    disabled={submitting || !canManageInventory}
                  >
                    Reenviar com a mesma chave
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => {
                    const nextForm = {
                      ...buildInitialForm(),
                      type: form.type,
                    };
                    setForm(nextForm);
                    setSubmitError(null);
                    setFieldErrors([]);
                    resetRetryState();

                    const nextBuilt = buildPayloadFromForm({
                      form: nextForm,
                      selectedItemId,
                      selectedTrackLot,
                    });

                    if (nextBuilt.payload) {
                      syncDraftFromPayload(nextBuilt.payload, true);
                    } else {
                      setDraftKey(createInventoryIdempotencyKey());
                      setDraftPayloadHash(null);
                    }
                  }}
                  disabled={submitting}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="d-grid gap-4">
            <div className="card shadow-sm">
              <div className="card-body">
              <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">
                <h3 className="h5 mb-0">Resumo da movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o</h3>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {lastCommand && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTechnicalDetails((current) => !current)}
                      aria-expanded={showTechnicalDetails}
                    >
                      {showTechnicalDetails ? "Ocultar detalhes tÃƒÆ’Ã‚Â©cnicos" : "Detalhes tÃƒÆ’Ã‚Â©cnicos"}
                    </Button>
                  )}
                  {lastCommand && (
                    <span className={`badge ${responseBadgeClass}`}>{responseBadgeLabel}</span>
                  )}
                </div>
              </div>

              {!lastCommand ? (
                <p className="text-muted mb-0">
                  Cadastre um produto, selecione-o e registre uma movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o para
                  acompanhar o saldo atualizado desta fazenda.
                </p>
              ) : (
                <div className="d-grid gap-3">
                  <div className="alert alert-success mb-0">
                    {lastCommand.responseStatus === 200
                      ? "O sistema reconheceu este reenvio e evitou duplicidade."
                      : "MovimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o registrada com sucesso."}
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <div className="text-muted small">Produto</div>
                      <div>
                        {items.find((entry) => entry.id === lastCommand.movement.itemId)?.name ??
                          "Produto selecionado"}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Tipo</div>
                      <div>
                        {MOVEMENT_OPTIONS.find((option) => option.value === lastCommand.movement.type)
                          ?.label ?? lastCommand.movement.type}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Lote</div>
                      <div>{getLotDisplay(lastCommand.movement.lotId)}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Quantidade</div>
                      <div>{formatDecimal(lastCommand.movement.quantity)}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Saldo apÃƒÆ’Ã‚Â³s movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o</div>
                      <div>{formatDecimal(lastCommand.movement.resultingBalance)}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Data da movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o</div>
                      <div>{lastCommand.movement.movementDate}</div>
                    </div>
                    <div className="col-12">
                      <div className="text-muted small">Registrado em</div>
                      <div>{formatDateTime(lastCommand.movement.createdAt)}</div>
                    </div>
                  </div>

                  {showTechnicalDetails && (
                    <div className="border rounded-3 p-3 bg-light">
                      <div className="small text-muted text-uppercase mb-2">Detalhes tÃƒÆ’Ã‚Â©cnicos</div>
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="text-muted small">Status HTTP</div>
                          <div>{lastCommand.responseStatus}</div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted small">Chave de idempotÃƒÆ’Ã‚Âªncia</div>
                          <code>{lastCommand.idempotencyKey}</code>
                        </div>
                        <div className="col-6">
                          <div className="text-muted small">movementId</div>
                          <div>{lastCommand.movement.movementId}</div>
                        </div>
                        <div className="col-6">
                          <div className="text-muted small">itemId</div>
                          <div>{lastCommand.movement.itemId}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>

            <InventoryLotManagementCard
              selectedItem={selectedItem}
              selectedTrackLot={selectedTrackLot}
              lotsPageTotal={lotsPage?.totalElements}
              selectedItemAllLots={selectedItemAllLots}
              lotsError={lotsError}
              loadingLots={loadingLots}
              canManageInventory={canManageInventory}
              updatingLotId={updatingLotId}
              onOpenCreateLot={() => {
                setLotForm(buildInitialLotForm());
                setCreateLotError(null);
                setCreateLotFieldErrors([]);
                setIsCreateLotModalOpen(true);
              }}
              onRetryLots={() => setLotsReloadVersion((current) => current + 1)}
              onToggleLotActive={(lot) => void handleToggleLotActive(lot)}
            />
          </div>
        </div>
      </div>}

      {activeTab === "balances" && (
        <div className="row g-4 mt-1 align-items-start">
          <div className="col-12 col-xl-4">
            <Card title="Filtros de saldos">
              {itemsError && (
                <div className="alert alert-warning" role="alert">
                  {itemsError}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Item</label>
                <select
                  className="form-select"
                  value={balanceFilters.itemId}
                  onChange={(event) => updateBalanceFilters({ itemId: event.target.value })}
                  disabled={loadingItems}
                >
                  <option value="">Todos os itens</option>
                  {items.map((item) => (
                    <option key={`balance-item-${item.id}`} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Lote</label>
                <select
                  className="form-select"
                  value={balanceFilters.lotId}
                  onChange={(event) => updateBalanceFilters({ lotId: event.target.value })}
                  disabled={loadingLots}
                >
                  <option value="">Todos os lotes</option>
                  {balanceAvailableLots.map((lot) => (
                    <option key={`balance-lot-${lot.id}`} value={lot.id}>
                      {formatLotLabel(lot)}
                    </option>
                  ))}
                </select>
                {balanceFilters.itemId && balanceAvailableLots.length === 0 && (
                  <div className="form-text">Nenhum lote cadastrado para o item selecionado.</div>
                )}
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setBalanceFilters({
                      itemId: "",
                      lotId: "",
                      page: 0,
                    })
                  }
                >
                  Limpar filtros
                </Button>
              </div>
            </Card>
          </div>

          <div className="col-12 col-xl-8">
            <Card
              title="Saldos por item e lote"
              description="Consulta paginada do saldo atual por item de estoque."
              actions={
                balancesPage ? (
                  <span className="badge text-bg-light">
                    {balancesPage.totalElements} registro(s)
                  </span>
                ) : undefined
              }
            >
              {balancesError ? (
                <ErrorState
                  title="NÃƒÆ’Ã‚Â£o foi possÃƒÆ’Ã‚Â­vel consultar os saldos"
                  description={balancesError}
                  onRetry={() => setBalanceFilters((current) => ({ ...current }))}
                />
              ) : loadingBalances ? (
                <LoadingState label="Carregando saldos..." />
              ) : balances.length === 0 ? (
                <EmptyState
                  title="Nenhum saldo encontrado"
                  description="Ajuste os filtros para localizar um saldo cadastrado nesta fazenda."
                />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Lote</th>
                      <th scope="col">Controle</th>
                      <th scope="col" className="text-end">
                        Quantidade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((entry) => (
                      <tr key={`balance-${entry.itemId}-${entry.lotId ?? "none"}`}>
                        <td>
                          <div className="fw-semibold">{entry.itemName}</div>
                        </td>
                        <td>{getLotDisplay(entry.lotId)}</td>
                        <td>
                          <span
                            className={`badge ${
                              entry.trackLot ? "text-bg-primary" : "text-bg-light"
                            }`}
                          >
                            {entry.trackLot ? "Com lote" : "Sem lote"}
                          </span>
                        </td>
                        <td className="text-end">{formatDecimal(entry.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {balancesPage && balancesPage.totalPages > 0 && (
                <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mt-3">
                  <span className="small text-muted">
                    PÃƒÆ’Ã‚Â¡gina {balancesPage.number + 1} de {balancesPage.totalPages}
                  </span>
                  <div className="d-flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        updateBalanceFilters({ page: Math.max(0, balanceFilters.page - 1) })
                      }
                      disabled={!canGoToPreviousBalancesPage || loadingBalances}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateBalanceFilters({ page: balanceFilters.page + 1 })}
                      disabled={!canGoToNextBalancesPage || loadingBalances}
                    >
                      PrÃƒÆ’Ã‚Â³xima
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="row g-4 mt-1 align-items-start">
          <div className="col-12 col-xl-4">
            <Card title="Filtros do histÃƒÆ’Ã‚Â³rico">
              {itemsError && (
                <div className="alert alert-warning" role="alert">
                  {itemsError}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Item</label>
                <select
                  className="form-select"
                  value={historyFilters.itemId}
                  onChange={(event) => updateHistoryFilters({ itemId: event.target.value })}
                  disabled={loadingItems}
                >
                  <option value="">Todos os itens</option>
                  {items.map((item) => (
                    <option key={`history-item-${item.id}`} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Tipo</label>
                <select
                  className="form-select"
                  value={historyFilters.type}
                  onChange={(event) =>
                    updateHistoryFilters({
                      type: event.target.value as "" | InventoryMovementType,
                    })
                  }
                >
                  <option value="">Todos os tipos</option>
                  {MOVEMENT_OPTIONS.map((option) => (
                    <option key={`history-type-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Lote</label>
                <select
                  className="form-select"
                  value={historyFilters.lotId}
                  onChange={(event) => updateHistoryFilters({ lotId: event.target.value })}
                  disabled={loadingLots}
                >
                  <option value="">Todos os lotes</option>
                  {historyAvailableLots.map((lot) => (
                    <option key={`history-lot-${lot.id}`} value={lot.id}>
                      {formatLotLabel(lot)}
                    </option>
                  ))}
                </select>
                {historyFilters.itemId && historyAvailableLots.length === 0 && (
                  <div className="form-text">Nenhum lote cadastrado para o item selecionado.</div>
                )}
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6 col-xl-12">
                  <label className="form-label">Data inicial</label>
                  <input
                    className="form-control"
                    type="date"
                    value={historyFilters.fromDate}
                    onChange={(event) => updateHistoryFilters({ fromDate: event.target.value })}
                  />
                </div>
                <div className="col-12 col-md-6 col-xl-12">
                  <label className="form-label">Data final</label>
                  <input
                    className="form-control"
                    type="date"
                    value={historyFilters.toDate}
                    onChange={(event) => updateHistoryFilters({ toDate: event.target.value })}
                  />
                </div>
              </div>

              <div className="mt-3 mb-3">
                <label className="form-label">OrdenaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o</label>
                <select
                  className="form-select"
                  value={historyFilters.sort}
                  onChange={(event) =>
                    updateHistoryFilters({
                      sort: event.target.value as HistorySortValue,
                    })
                  }
                >
                  {HISTORY_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setHistoryFilters({
                      itemId: "",
                      lotId: "",
                      type: "",
                      fromDate: "",
                      toDate: "",
                      page: 0,
                      sort: "movementDate,desc",
                    })
                  }
                >
                  Limpar filtros
                </Button>
              </div>
            </Card>
          </div>

          <div className="col-12 col-xl-8">
            <Card
              title="HistÃƒÆ’Ã‚Â³rico de movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes"
              description="Consulte movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes por item, tipo, lote e perÃƒÆ’Ã‚Â­odo."
              actions={
                movementsPage ? (
                  <span className="badge text-bg-light">
                    {movementsPage.totalElements} registro(s)
                  </span>
                ) : undefined
              }
            >
              {movementsError ? (
                <ErrorState
                  title="NÃƒÆ’Ã‚Â£o foi possÃƒÆ’Ã‚Â­vel carregar o histÃƒÆ’Ã‚Â³rico"
                  description={movementsError}
                  onRetry={() => setHistoryFilters((current) => ({ ...current }))}
                />
              ) : loadingMovements ? (
                <LoadingState label="Carregando histÃƒÆ’Ã‚Â³rico..." />
              ) : movements.length === 0 ? (
                <EmptyState
                  title="Nenhuma movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o encontrada"
                  description="Ajuste os filtros para localizar movimentaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes registradas nesta fazenda."
                />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th scope="col">Data</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">Item</th>
                      <th scope="col">Lote</th>
                      <th scope="col" className="text-end">
                        Quantidade
                      </th>
                      <th scope="col" className="text-end">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((entry) => (
                      <tr key={`movement-${entry.movementId}`}>
                        <td>
                          <div>{entry.movementDate}</div>
                          <div className="small text-muted">
                            criado em {formatDateTime(entry.createdAt)}
                          </div>
                        </td>
                        <td>
                          <div>{entry.type}</div>
                          {entry.adjustDirection && (
                            <div className="small text-muted">{entry.adjustDirection}</div>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold">{entry.itemName}</div>
                          {entry.reason && (
                            <div className="small text-muted">{entry.reason}</div>
                          )}
                        </td>
                        <td>{getLotDisplay(entry.lotId)}</td>
                        <td className="text-end">{formatDecimal(entry.quantity)}</td>
                        <td className="text-end">{formatDecimal(entry.resultingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {movementsPage && movementsPage.totalPages > 0 && (
                <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mt-3">
                  <span className="small text-muted">
                    PÃƒÆ’Ã‚Â¡gina {movementsPage.number + 1} de {movementsPage.totalPages}
                  </span>
                  <div className="d-flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        updateHistoryFilters({ page: Math.max(0, historyFilters.page - 1) })
                      }
                      disabled={!canGoToPreviousHistoryPage || loadingMovements}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateHistoryFilters({ page: historyFilters.page + 1 })}
                      disabled={!canGoToNextHistoryPage || loadingMovements}
                    >
                      PrÃƒÆ’Ã‚Â³xima
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      <Modal
        isOpen={isCreateItemModalOpen}
        onClose={closeCreateItemModal}
        title="Cadastrar produto"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeCreateItemModal} disabled={creatingItem}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreateItem()}
              disabled={creatingItem}
              loading={creatingItem}
            >
              {creatingItem ? "Salvando..." : "Salvar produto"}
            </Button>
          </>
        }
      >
        {createItemError && (
          <div className="alert alert-danger" role="alert">
            {createItemError}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Nome do produto</label>
          <input
            className={`form-control ${
              getCreateItemMessages("name").length ? "is-invalid" : ""
            }`}
            type="text"
            maxLength={120}
            value={itemForm.name}
            onChange={(event) => {
              setCreateItemError(null);
              setCreateItemFieldErrors([]);
              setItemForm((current) => ({
                ...current,
                name: event.target.value,
              }));
            }}
            disabled={creatingItem}
            placeholder="Ex.: RaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o Inicial 20 kg"
          />
          {renderCreateItemFeedback("name")}
        </div>

        <div className="form-check">
          <input
            className="form-check-input"
            id="inventory-track-lot"
            type="checkbox"
            checked={itemForm.trackLot}
            onChange={(event) => {
              setCreateItemError(null);
              setCreateItemFieldErrors([]);
              setItemForm((current) => ({
                ...current,
                trackLot: event.target.checked,
              }));
            }}
            disabled={creatingItem}
          />
          <label className="form-check-label" htmlFor="inventory-track-lot">
            Este produto usa controle por lote
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={isCreateLotModalOpen}
        onClose={closeCreateLotModal}
        title="Cadastrar lote"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeCreateLotModal} disabled={creatingLot}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreateLot()}
              disabled={creatingLot}
              loading={creatingLot}
            >
              {creatingLot ? "Salvando..." : "Salvar lote"}
            </Button>
          </>
        }
      >
        {createLotError && (
          <div className="alert alert-danger" role="alert">
            {createLotError}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Produto</label>
          <input
            className={`form-control ${getCreateLotMessages("itemId").length ? "is-invalid" : ""}`}
            type="text"
            value={
              selectedItem
                ? `${selectedItem.name}${selectedTrackLot ? "" : " (sem controle por lote)"}`
                : "Nenhum produto selecionado"
            }
            disabled
          />
          {renderCreateLotFeedback("itemId")}
        </div>

        <div className="mb-3">
          <label className="form-label">CÃƒÆ’Ã‚Â³digo do lote</label>
          <input
            className={`form-control ${getCreateLotMessages("code").length ? "is-invalid" : ""}`}
            type="text"
            maxLength={80}
            value={lotForm.code}
            onChange={(event) => {
              setCreateLotError(null);
              setCreateLotFieldErrors([]);
              setLotForm((current) => ({
                ...current,
                code: event.target.value,
              }));
            }}
            disabled={creatingLot}
            placeholder="Ex.: RACAO-2026-03"
          />
          {renderCreateLotFeedback("code")}
        </div>

        <div className="mb-3">
          <label className="form-label">DescriÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o</label>
          <textarea
            className={`form-control ${getCreateLotMessages("description").length ? "is-invalid" : ""}`}
            rows={3}
            maxLength={500}
            value={lotForm.description}
            onChange={(event) => {
              setCreateLotError(null);
              setCreateLotFieldErrors([]);
              setLotForm((current) => ({
                ...current,
                description: event.target.value,
              }));
            }}
            disabled={creatingLot}
            placeholder="Ex.: RaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de crescimento - lote marÃƒÆ’Ã‚Â§o/2026"
          />
          {renderCreateLotFeedback("description")}
        </div>

        <div className="mb-3">
          <label className="form-label">Validade</label>
          <input
            className="form-control"
            type="date"
            value={lotForm.expirationDate}
            onChange={(event) => {
              setCreateLotError(null);
              setCreateLotFieldErrors([]);
              setLotForm((current) => ({
                ...current,
                expirationDate: event.target.value,
              }));
            }}
            disabled={creatingLot}
          />
        </div>

        <div className="form-check">
          <input
            className="form-check-input"
            id="inventory-lot-active"
            type="checkbox"
            checked={lotForm.active}
            onChange={(event) => {
              setCreateLotError(null);
              setCreateLotFieldErrors([]);
              setLotForm((current) => ({
                ...current,
                active: event.target.checked,
              }));
            }}
            disabled={creatingLot}
          />
          <label className="form-check-label" htmlFor="inventory-lot-active">
            Criar lote como ativo
          </label>
        </div>
      </Modal>
    </div>
  );
}

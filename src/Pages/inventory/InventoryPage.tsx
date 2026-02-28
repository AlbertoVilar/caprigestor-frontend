import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import {
  createInventoryIdempotencyKey,
  createInventoryMovement,
  createInventoryPayloadHash,
} from "../../api/GoatFarmAPI/inventory";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { usePermissions } from "../../Hooks/usePermissions";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import type {
  InventoryAdjustDirection,
  InventoryMovementCommandResult,
  InventoryMovementCreateRequestDTO,
  InventoryMovementType,
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

type InventoryFormState = {
  type: InventoryMovementType;
  quantity: string;
  itemId: string;
  lotId: string;
  adjustDirection: InventoryAdjustDirection | "";
  movementDate: string;
  reason: string;
};

type BuildPayloadResult = {
  payload?: InventoryMovementCreateRequestDTO;
  error?: string;
};

const MOVEMENT_OPTIONS: Array<{ value: InventoryMovementType; label: string }> = [
  { value: "IN", label: "Entrada" },
  { value: "OUT", label: "Saída" },
  { value: "ADJUST", label: "Ajuste" },
];

const ADJUST_OPTIONS: Array<{ value: InventoryAdjustDirection; label: string }> = [
  { value: "INCREASE", label: "Aumentar saldo" },
  { value: "DECREASE", label: "Reduzir saldo" },
];

const buildInitialForm = (): InventoryFormState => ({
  type: "OUT",
  quantity: "",
  itemId: "",
  lotId: "",
  adjustDirection: "",
  movementDate: new Date().toISOString().slice(0, 10),
  reason: "",
});

const mapPayloadToForm = (
  payload: InventoryMovementCreateRequestDTO
): InventoryFormState => ({
  type: payload.type,
  quantity: `${payload.quantity}`,
  itemId: `${payload.itemId}`,
  lotId: payload.lotId != null ? `${payload.lotId}` : "",
  adjustDirection: payload.type === "ADJUST" ? payload.adjustDirection ?? "" : "",
  movementDate: payload.movementDate ?? new Date().toISOString().slice(0, 10),
  reason: payload.reason ?? "",
});

const parsePositiveNumber = (value: string): number | null => {
  if (!value.trim()) return null;
  const normalized = Number(value.replace(",", "."));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
};

const formatDateTime = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
};

const buildPayloadFromForm = (form: InventoryFormState): BuildPayloadResult => {
  const quantity = parsePositiveNumber(form.quantity);
  const itemId = parsePositiveNumber(form.itemId);
  const lotId = form.lotId.trim() ? parsePositiveNumber(form.lotId) : undefined;

  if (itemId == null) {
    return { error: "Informe um itemId válido." };
  }

  if (quantity == null) {
    return { error: "Informe uma quantidade maior que zero." };
  }

  if (form.lotId.trim() && lotId == null) {
    return { error: "lotId deve ser um número positivo." };
  }

  if (form.type === "ADJUST" && !form.adjustDirection) {
    return { error: "Selecione a direção do ajuste." };
  }

  return {
    payload: {
      type: form.type,
      quantity,
      itemId,
      ...(lotId != null ? { lotId } : {}),
      ...(form.type === "ADJUST" && form.adjustDirection
        ? { adjustDirection: form.adjustDirection }
        : {}),
      ...(form.movementDate ? { movementDate: form.movementDate } : {}),
      ...(form.reason.trim() ? { reason: form.reason.trim() } : {}),
    },
  };
};

export default function InventoryPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const { canCreateGoat, loading: loadingPermissions } = useFarmPermissions(
    Number.isNaN(farmIdNumber) ? undefined : farmIdNumber
  );

  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [form, setForm] = useState<InventoryFormState>(buildInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Array<{ fieldName?: string; message: string }>>(
    []
  );
  const [lastCommand, setLastCommand] = useState<InventoryMovementCommandResult | null>(null);
  const [draftKey, setDraftKey] = useState<string | null>(createInventoryIdempotencyKey());
  const [draftPayloadHash, setDraftPayloadHash] = useState<string | null>(null);
  const [retrySnapshot, setRetrySnapshot] = useState<InventoryRetrySnapshot | null>(null);

  const canManageInventory = permissions.isAdmin() || canCreateGoat;

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
  }, [farmIdNumber]);

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

  const updateField = <K extends keyof InventoryFormState>(key: K, value: InventoryFormState[K]) => {
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

    const built = buildPayloadFromForm(nextForm);

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

  const renderFieldFeedback = (fieldName: string) => {
    const messages = getFieldMessages(fieldName);

    if (messages.length === 0) {
      return null;
    }

    return <div className="invalid-feedback d-block">{messages.join(" ")}</div>;
  };

  const handleSubmit = async (mode: "create" | "retry" = "create") => {
    if (Number.isNaN(farmIdNumber)) {
      setSubmitError("FarmId inválido.");
      return;
    }

    const built = buildPayloadFromForm(form);
    if (!built.payload) {
      setSubmitError(built.error ?? "Revise os dados da movimentação.");
      return;
    }

    if (mode === "retry" && retrySnapshot && !isSameInventoryRetryPayload(retrySnapshot, built.payload)) {
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
      resetRetryState();

      const nextForm = {
        ...buildInitialForm(),
        type: form.type,
        itemId: form.itemId,
        lotId: form.lotId,
      };

      setForm(nextForm);
      const nextBuilt = buildPayloadFromForm(nextForm);
      if (nextBuilt.payload) {
        syncDraftFromPayload(nextBuilt.payload, true);
      } else {
        setDraftKey(createInventoryIdempotencyKey());
        setDraftPayloadHash(null);
      }

      toast.success(
        result.responseStatus === 200
          ? "Repetição idempotente confirmada com a mesma chave."
          : "Movimentação registrada com sucesso."
      );
    } catch (error) {
      console.error("Erro ao registrar movimentação de inventory", error);
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
          "Falha de rede ou timeout. Você pode reenviar com a mesma chave de idempotência sem duplicar a movimentação."
        );
        toast.warning("Falha de rede. Use “Reenviar” para repetir com segurança.");
        return;
      }

      resetRetryState();

      const message =
        parsed.status === 409
          ? "Conflito de idempotência. Revise os dados e faça um novo envio com uma nova chave."
          : parsed.status === 403
            ? "Sem permissão para registrar movimentações nesta fazenda."
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
      <div className="mt-5">
        <div className="alert alert-danger">Identificador da fazenda inválido.</div>
      </div>
    );
  }

  const responseBadgeClass =
    lastCommand?.responseStatus === 200 ? "text-bg-info" : "text-bg-success";
  const responseBadgeLabel =
    lastCommand?.responseStatus === 200 ? "Repetido (idempotência)" : "Criado";

  return (
    <div className="py-4">
      <GoatFarmHeader
        name={farmData?.name || "Capril"}
        logoUrl={farmData?.logoUrl}
        farmId={farmIdNumber}
      />

      <PageHeader
        title="Inventory"
        description="Registrar movimentações do ledger de estoque com retry idempotente seguro."
        showBackButton={true}
        backButtonUrl="/goatfarms"
      />

      <div className="alert alert-info mt-3">
        <strong>MVP atual:</strong> o backend expõe o ledger core via comando de
        movimentação. Item, lote e saldo detalhado ainda não possuem UI dedicada.
      </div>

      <div className="row g-4 mt-1 align-items-start">
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h3 className="h5 mb-1">Nova movimentação</h3>
                  <p className="text-muted mb-0">
                    Endpoint: <code>/api/v1/goatfarms/{farmIdNumber}/inventory/movements</code>
                  </p>
                </div>
                {!canManageInventory && !loadingPermissions && (
                  <span className="badge text-bg-warning">Somente leitura</span>
                )}
              </div>

              {submitError && (
                <div className="alert alert-danger" role="alert">
                  {submitError}
                </div>
              )}

              {retrySnapshot && (
                <div className="alert alert-warning" role="alert">
                  <strong>Reenvio disponível:</strong> a mesma Idempotency-Key será reutilizada
                  se você clicar em <strong>Reenviar</strong> sem alterar o payload.
                </div>
              )}

              {fieldErrors.length > 0 && (
                <div className="alert alert-warning" role="alert">
                  <strong>Campos com erro:</strong>
                  <ul className="mb-0 mt-2 ps-3">
                    {fieldErrors.map((entry, index) => (
                      <li key={`${entry.fieldName || "field"}-${index}`}>
                        {entry.fieldName ? `${entry.fieldName}: ` : ""}
                        {entry.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="row g-3">
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

                <div className="col-12 col-md-6">
                  <label className="form-label">itemId</label>
                  <input
                    className={`form-control ${getFieldMessages("itemId").length ? "is-invalid" : ""}`}
                    type="number"
                    min="1"
                    step="1"
                    value={form.itemId}
                    onChange={(event) => updateField("itemId", event.target.value)}
                    disabled={submitting || !canManageInventory}
                    placeholder="Ex.: 101"
                  />
                  {renderFieldFeedback("itemId")}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">lotId (opcional)</label>
                  <input
                    className={`form-control ${getFieldMessages("lotId").length ? "is-invalid" : ""}`}
                    type="number"
                    min="1"
                    step="1"
                    value={form.lotId}
                    onChange={(event) => updateField("lotId", event.target.value)}
                    disabled={submitting || !canManageInventory}
                    placeholder="Ex.: 10"
                  />
                  {renderFieldFeedback("lotId")}
                </div>

                {form.type === "ADJUST" && (
                  <div className="col-12">
                    <label className="form-label">Direção do ajuste</label>
                    <select
                      className={`form-select ${getFieldMessages("adjustDirection").length ? "is-invalid" : ""}`}
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
                  <label className="form-label">Data da movimentação</label>
                  <input
                    className={`form-control ${getFieldMessages("movementDate").length ? "is-invalid" : ""}`}
                    type="date"
                    value={form.movementDate}
                    onChange={(event) => updateField("movementDate", event.target.value)}
                    disabled={submitting || !canManageInventory}
                  />
                  {renderFieldFeedback("movementDate")}
                </div>

                <div className="col-12">
                  <label className="form-label">Motivo / observação</label>
                  <textarea
                    className={`form-control ${getFieldMessages("reason").length ? "is-invalid" : ""}`}
                    rows={3}
                    maxLength={500}
                    value={form.reason}
                    onChange={(event) => updateField("reason", event.target.value)}
                    disabled={submitting || !canManageInventory}
                    placeholder="Ex.: Baixa por aplicação sanitária"
                  />
                  {renderFieldFeedback("reason")}
                </div>
              </div>

              <div className="small text-muted mt-3">
                Chave preparada: <code>{draftKey ?? "será gerada ao enviar"}</code>
              </div>

              <div className="d-flex gap-2 flex-wrap mt-4">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => void handleSubmit("create")}
                  disabled={submitting || !canManageInventory}
                >
                  {submitting ? "Enviando..." : "Registrar movimentação"}
                </button>
                {retrySnapshot && (
                  <button
                    className="btn btn-outline-warning"
                    type="button"
                    onClick={() => void handleSubmit("retry")}
                    disabled={submitting || !canManageInventory}
                  >
                    Reenviar com a mesma chave
                  </button>
                )}
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    const nextForm = buildInitialForm();
                    setForm(nextForm);
                    setSubmitError(null);
                    setFieldErrors([]);
                    resetRetryState();
                    setDraftKey(createInventoryIdempotencyKey());
                    setDraftPayloadHash(null);
                  }}
                  disabled={submitting}
                >
                  Limpar
                </button>
                <button
                  className="btn btn-outline-dark"
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">
                <h3 className="h5 mb-0">Último retorno do backend</h3>
                {lastCommand && <span className={`badge ${responseBadgeClass}`}>{responseBadgeLabel}</span>}
              </div>

              {!lastCommand ? (
                <p className="text-muted mb-0">
                  Envie uma movimentação para visualizar o retorno do comando, a chave
                  idempotente utilizada e o saldo resultante.
                </p>
              ) : (
                <div className="d-grid gap-3">
                  <div className="alert alert-success mb-0">
                    HTTP {lastCommand.responseStatus}: {responseBadgeLabel}.
                  </div>

                  <div>
                    <div className="text-muted small">Idempotency-Key</div>
                    <code>{lastCommand.idempotencyKey}</code>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <div className="text-muted small">movementId</div>
                      <div>{lastCommand.movement.movementId}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Tipo</div>
                      <div>{lastCommand.movement.type}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">itemId</div>
                      <div>{lastCommand.movement.itemId}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">lotId</div>
                      <div>{lastCommand.movement.lotId ?? "-"}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Quantidade</div>
                      <div>{lastCommand.movement.quantity}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Saldo resultante</div>
                      <div>{lastCommand.movement.resultingBalance}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Data da movimentação</div>
                      <div>{lastCommand.movement.movementDate}</div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted small">Criado em</div>
                      <div>{formatDateTime(lastCommand.movement.createdAt)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

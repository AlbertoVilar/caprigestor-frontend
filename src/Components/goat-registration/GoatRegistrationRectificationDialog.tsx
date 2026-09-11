import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Alert, Button, Modal } from "../ui";
import {
  rectifyGoatRegistration,
  fetchGoatRegistrationHistory,
} from "../../api/GoatAPI/goat";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type {
  GoatRegistrationHistoryItem,
  GoatRegistrationRectificationResponse,
  RegistrationRectificationSource,
} from "../../Models/GoatRegistrationRectification";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import { deriveRegistrationPreview, normalizeRegistrationPart } from "./registrationIdentity";
import "./goatRegistration.css";

const sourceOptions: Array<{ value: RegistrationRectificationSource; label: string }> = [
  { value: "ABCC", label: "ABCC" },
  { value: "OFFICIAL_DOCUMENT", label: "Documento oficial" },
  { value: "OTHER", label: "Outro" },
];

const sourceLabel = (source: RegistrationRectificationSource): string =>
  sourceOptions.find((option) => option.value === source)?.label ?? source;

interface RectificationDialogProps {
  goat: GoatResponseDTO;
  farmId: number;
  goatRouteId: string;
  onClose: () => void;
  onSuccess: (response: GoatRegistrationRectificationResponse) => void;
}

export default function GoatRegistrationRectificationDialog({
  goat,
  farmId,
  goatRouteId,
  onClose,
  onSuccess,
}: RectificationDialogProps) {
  const [tod, setTod] = useState(goat.tod ?? "");
  const [toe, setToe] = useState(goat.toe ?? "");
  const [source, setSource] = useState<RegistrationRectificationSource | "">("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTod(goat.tod ?? "");
    setToe(goat.toe ?? "");
    setSource("");
    setEvidenceReference("");
    setReason("");
    setConfirming(false);
    setError(null);
  }, [goat]);

  const currentRegistration = normalizeRegistrationPart(goat.registrationNumber ?? "");
  const newRegistration = useMemo(() => deriveRegistrationPreview(tod, toe), [tod, toe]);
  const validationMessage = !normalizeRegistrationPart(tod)
    ? "Informe o TOD corrigido."
    : !normalizeRegistrationPart(toe)
      ? "Informe o TOE corrigido."
      : !source
        ? "Selecione a origem da correção."
        : !evidenceReference.trim()
          ? "Informe a referência da evidência."
          : !reason.trim()
            ? "Informe o motivo da retificação."
            : newRegistration === currentRegistration
              ? "A nova identidade precisa ser diferente da atual."
              : null;

  const handleSubmit = async () => {
    setError(null);
    if (validationMessage) {
      setError(validationMessage);
      setConfirming(false);
      return;
    }

    if (!confirming) {
      setConfirming(true);
      return;
    }

    try {
      setSubmitting(true);
      const response = await rectifyGoatRegistration(farmId, goatRouteId, {
        tod: normalizeRegistrationPart(tod),
        toe: normalizeRegistrationPart(toe),
        source: source as RegistrationRectificationSource,
        evidenceReference: evidenceReference.trim(),
        reason: reason.trim(),
      });
      toast.success("Identidade registral retificada com sucesso.");
      onSuccess(response);
    } catch (requestError) {
      const parsed = parseApiError(requestError);
      const message = parsed.status === 409
        ? "O RG derivado já está em uso por outra cabra. Revise TOD e TOE."
        : getApiErrorMessage(parsed);
      setError(message);
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Retificar registro do animal"
      size="lg"
      closeOnOverlayClick={!submitting}
      closeOnEscape={!submitting}
      footer={
        <div className="goat-registration-modal__actions">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          {confirming && (
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={submitting}>
              Voltar aos dados
            </Button>
          )}
          <Button variant="primary" onClick={() => void handleSubmit()} loading={submitting}>
            {confirming ? "Confirmar retificação" : "Revisar correção"}
          </Button>
        </div>
      }
    >
      <div className="goat-registration-modal">
        <p className="goat-registration-modal__intro">
          Esta operação corrige a identidade registral do mesmo animal. O GoatId técnico,
          a genealogia e todo o histórico operacional serão preservados.
        </p>

        <section className="goat-registration-modal__current" aria-label="Identidade atual">
          <div>
            <span>Animal</span>
            <strong>{goat.name || "Sem nome"}</strong>
          </div>
          <div>
            <span>GoatId técnico</span>
            <strong>{goat.technicalId ?? goat.id ?? "—"}</strong>
          </div>
          <div>
            <span>RG atual</span>
            <strong>{goat.registrationNumber || "—"}</strong>
          </div>
          <div>
            <span>TOD / TOE atuais</span>
            <strong>{goat.tod || "—"} / {goat.toe || "—"}</strong>
          </div>
        </section>

        {confirming ? (
          <section className="goat-registration-modal__confirmation" aria-label="Confirmação da retificação">
            <span className="goat-registration-modal__eyebrow">Confirme a alteração</span>
            <h3>{currentRegistration || "—"} <span aria-hidden="true">→</span> {newRegistration}</h3>
            <p>
              O mesmo animal será mantido e seus registros de reprodução, produção, saúde,
              vendas e eventos continuarão vinculados ao GoatId técnico.
            </p>
            <dl>
              <div><dt>TOD</dt><dd>{normalizeRegistrationPart(tod)}</dd></div>
              <div><dt>TOE</dt><dd>{normalizeRegistrationPart(toe)}</dd></div>
              <div><dt>Origem</dt><dd>{sourceLabel(source as RegistrationRectificationSource)}</dd></div>
              <div><dt>Evidência</dt><dd>{evidenceReference.trim()}</dd></div>
              <div><dt>Motivo</dt><dd>{reason.trim()}</dd></div>
            </dl>
          </section>
        ) : (
          <section className="goat-registration-modal__form" aria-label="Dados corrigidos">
            <div className="goat-registration-modal__section-heading">
              <span className="goat-registration-modal__eyebrow">Nova identidade</span>
              <h3>Informe TOD e TOE corrigidos</h3>
              <p>O RG será sempre derivado pelo backend a partir destes dois valores.</p>
            </div>
            <div className="goat-registration-modal__grid">
              <label>
                TOD corrigido *
                <input value={tod} onChange={(event) => setTod(event.target.value)} maxLength={15} />
              </label>
              <label>
                TOE corrigido *
                <input value={toe} onChange={(event) => setToe(event.target.value)} maxLength={15} />
              </label>
            </div>
            <div className="goat-registration-modal__preview" aria-live="polite">
              <span>Prévia do novo RG</span>
              <strong>{newRegistration || "Informe TOD + TOE"}</strong>
            </div>
            <div className="goat-registration-modal__grid">
              <label>
                Origem da correção *
                <select value={source} onChange={(event) => setSource(event.target.value as RegistrationRectificationSource)}>
                  <option value="">Selecione...</option>
                  {sourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Referência da evidência *
                <input value={evidenceReference} onChange={(event) => setEvidenceReference(event.target.value)} maxLength={255} placeholder="Ex.: ABCC-2026-001" />
              </label>
            </div>
            <label className="goat-registration-modal__full-field">
              Motivo da retificação *
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} />
            </label>
          </section>
        )}

        {error && <Alert variant="error" title="Não foi possível continuar">{error}</Alert>}
      </div>
    </Modal>
  );
}

interface HistoryModalProps {
  farmId: number;
  goatRouteId: string;
  onClose: () => void;
}

export function GoatRegistrationHistoryModal({ farmId, goatRouteId, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<GoatRegistrationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchGoatRegistrationHistory(farmId, goatRouteId)
      .then((items) => {
        if (!cancelled) setHistory(items);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(parseApiError(requestError)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [farmId, goatRouteId]);

  return (
    <Modal isOpen onClose={onClose} title="Histórico de registro" size="xl">
      <div className="goat-registration-history">
        <p className="goat-registration-modal__intro">
          Histórico privado das retificações registradas para este animal. Os valores antigos
          permanecem como fotografia do momento da correção.
        </p>
        {loading && <p className="goat-registration-history__state">Carregando histórico...</p>}
        {error && <Alert variant="error" title="Não foi possível carregar o histórico">{error}</Alert>}
        {!loading && !error && history.length === 0 && (
          <p className="goat-registration-history__state">Nenhuma retificação registrada.</p>
        )}
        {!loading && !error && history.length > 0 && (
          <ol className="goat-registration-history__list">
            {history.map((entry) => (
              <li key={entry.id} className="goat-registration-history__item">
                <div className="goat-registration-history__item-head">
                  <strong>{entry.oldRegistrationNumber} <span aria-hidden="true">→</span> {entry.newRegistrationNumber}</strong>
                  <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString("pt-BR")}</time>
                </div>
                <p>TOD/TOE: {entry.oldTod || "—"} / {entry.oldToe || "—"} → {entry.newTod || "—"} / {entry.newToe || "—"}</p>
                <p>Origem: {sourceLabel(entry.source)} · Evidência: {entry.evidenceReference}</p>
                <p>Motivo: {entry.reason}</p>
                <small>Ator técnico #{entry.actorUserId}</small>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Modal>
  );
}

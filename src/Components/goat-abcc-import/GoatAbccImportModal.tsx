import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  confirmGoatImportFromAbcc,
  listAbccRaceOptions,
  previewGoatFromAbcc,
  searchGoatsByAbcc,
  type GoatAbccFilterDna,
  type GoatAbccFilterSex,
  type GoatAbccPreviewResponseDTO,
  type GoatAbccRaceOptionDTO,
  type GoatAbccSearchItemDTO,
} from "../../api/GoatAPI/goatAbccImport";
import {
  mapGoatToBackend,
  type GoatFormData,
} from "../../Convertes/goats/goatConverter";
import { GoatBreedEnum, GoatCategoryEnum, breedLabels, categoryLabels } from "../../types/goatEnums";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import { UI_GENDER_LABELS, UI_STATUS_LABELS } from "../../utils/i18nGoat";
import { Alert, Button, EmptyState, ErrorState, LoadingState, Modal } from "../ui";
import "./goatAbccImportModal.css";

interface GoatAbccImportModalProps {
  isOpen: boolean;
  farmId: number;
  defaultTod?: string;
  onClose: () => void;
  onImported: () => void;
}

interface GoatAbccSearchFilters {
  raceName: string;
  affix: string;
  page: string;
  sex: "" | GoatAbccFilterSex;
  tod: string;
  toe: string;
  name: string;
  dna: "" | GoatAbccFilterDna;
}

export interface GoatAbccPreviewFormData extends GoatFormData {
  registrationNumber: string;
  name: string;
  genderLabel: "Macho" | "Fêmea";
  breed: string;
  color: string;
  birthDate: string;
  statusLabel: "Ativo" | "Inativo" | "Vendido" | "Falecido";
  tod: string;
  toe: string;
  category: GoatCategoryEnum;
  fatherRegistrationNumber: string;
  motherRegistrationNumber: string;
}

export interface GoatAbccImportModalViewProps {
  raceOptions: GoatAbccRaceOptionDTO[];
  racesLoading: boolean;
  racesError: string | null;
  onRetryLoadRaces: () => void;
  searchFilters: GoatAbccSearchFilters;
  onSearchFieldChange: <K extends keyof GoatAbccSearchFilters>(
    field: K,
    value: GoatAbccSearchFilters[K]
  ) => void;
  onSearchSubmit: () => void;
  onResetFlow: () => void;
  searching: boolean;
  searched: boolean;
  searchError: string | null;
  searchItems: GoatAbccSearchItemDTO[];
  selectedExternalId: string | null;
  onSelectSearchItem: (item: GoatAbccSearchItemDTO) => void;
  previewLoading: boolean;
  previewError: string | null;
  previewData: GoatAbccPreviewResponseDTO | null;
  previewForm: GoatAbccPreviewFormData | null;
  onPreviewFieldChange: <K extends keyof GoatAbccPreviewFormData>(
    field: K,
    value: GoatAbccPreviewFormData[K]
  ) => void;
  onConfirmImport: () => void;
  confirming: boolean;
  confirmError: string | null;
  confirmSuccess: string | null;
}

const BREED_OPTIONS = Object.values(GoatBreedEnum) as GoatBreedEnum[];

const initialSearchFilters: GoatAbccSearchFilters = {
  raceName: "",
  affix: "",
  page: "1",
  sex: "",
  tod: "",
  toe: "",
  name: "",
  dna: "",
};

function toGenderLabel(value?: string | null): "Macho" | "Fêmea" {
  const normalized = `${value ?? ""}`.toUpperCase();
  if (normalized.includes("FEMEA") || normalized.includes("FÊMEA") || normalized.includes("FEMALE")) {
    return "Fêmea";
  }
  return "Macho";
}

function toStatusLabel(value?: string | null): "Ativo" | "Inativo" | "Vendido" | "Falecido" {
  const normalized = `${value ?? ""}`.toUpperCase();
  if (normalized.includes("INAT")) {
    return "Inativo";
  }
  if (normalized.includes("VEND")) {
    return "Vendido";
  }
  if (normalized.includes("FALEC") || normalized.includes("OBITO") || normalized.includes("MORT")) {
    return "Falecido";
  }
  return "Ativo";
}

function toCategory(value?: string | null): GoatCategoryEnum {
  const normalized = `${value ?? ""}`.toUpperCase().trim();
  if (normalized === GoatCategoryEnum.PO) {
    return GoatCategoryEnum.PO;
  }
  if (normalized === GoatCategoryEnum.PC) {
    return GoatCategoryEnum.PC;
  }
  return GoatCategoryEnum.PA;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("pt-BR");
}

function buildPreviewFormData(
  preview: GoatAbccPreviewResponseDTO,
  defaultTod?: string
): GoatAbccPreviewFormData {
  const tod = preview.tod?.trim() || defaultTod?.trim() || "";
  const toe = preview.toe?.trim() || "";
  const inferredRegistration = `${tod}${toe}`.trim();

  return {
    registrationNumber: preview.registrationNumber?.trim() || inferredRegistration,
    name: preview.name?.trim() || "",
    genderLabel: toGenderLabel(preview.gender),
    breed: preview.breed?.trim() || "",
    color: preview.color?.trim() || "",
    birthDate: preview.birthDate?.trim() || "",
    statusLabel: toStatusLabel(preview.status),
    tod,
    toe,
    category: toCategory(preview.category),
    fatherRegistrationNumber: preview.fatherRegistrationNumber?.trim() || "",
    motherRegistrationNumber: preview.motherRegistrationNumber?.trim() || "",
  };
}

function buildSearchPayload(filters: GoatAbccSearchFilters, raceOptions: GoatAbccRaceOptionDTO[]) {
  const selectedRace = raceOptions.find((option) => option.name === filters.raceName);

  return {
    raceId: selectedRace?.id,
    raceName: filters.raceName.trim(),
    affix: filters.affix.trim(),
    page: Number(filters.page || "1"),
    sex: filters.sex || undefined,
    tod: filters.tod.trim() || undefined,
    toe: filters.toe.trim() || undefined,
    name: filters.name.trim() || undefined,
    dna: filters.dna || undefined,
  };
}

export function GoatAbccImportModalView({
  raceOptions,
  racesLoading,
  racesError,
  onRetryLoadRaces,
  searchFilters,
  onSearchFieldChange,
  onSearchSubmit,
  onResetFlow,
  searching,
  searched,
  searchError,
  searchItems,
  selectedExternalId,
  onSelectSearchItem,
  previewLoading,
  previewError,
  previewData,
  previewForm,
  onPreviewFieldChange,
  onConfirmImport,
  confirming,
  confirmError,
  confirmSuccess,
}: GoatAbccImportModalViewProps) {
  const selectedItem = useMemo(
    () => searchItems.find((item) => item.externalId === selectedExternalId) ?? null,
    [searchItems, selectedExternalId]
  );

  return (
    <div className="goat-abcc-import">
      <Alert variant="info" title="Importação ABCC opcional">
        O cadastro manual continua disponível. Use a ABCC apenas quando quiser trazer dados públicos para conferência.
      </Alert>

      <section className="goat-abcc-import__panel">
        <div className="goat-abcc-import__panel-head">
          <div>
            <h3>1. Buscar na ABCC</h3>
            <p>Preencha os filtros mínimos para localizar o animal público antes da pré-visualização.</p>
          </div>
          <Button variant="ghost" onClick={onResetFlow}>
            Limpar
          </Button>
        </div>

        {racesLoading && <LoadingState label="Carregando raças da ABCC..." />}

        {!racesLoading && racesError && (
          <ErrorState
            title="Não foi possível carregar as raças da ABCC"
            description={racesError}
            onRetry={onRetryLoadRaces}
          />
        )}

        {!racesLoading && !racesError && (
          <>
            <div className="goat-abcc-import__grid">
              <label className="goat-abcc-import__field">
                <span>Raça ABCC *</span>
                <select
                  value={searchFilters.raceName}
                  onChange={(event) => onSearchFieldChange("raceName", event.target.value)}
                >
                  <option value="">Selecione a raça</option>
                  {raceOptions.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="goat-abcc-import__field">
                <span>Afixo *</span>
                <input
                  type="text"
                  value={searchFilters.affix}
                  onChange={(event) => onSearchFieldChange("affix", event.target.value)}
                  placeholder="Ex.: CAPRIL VILAR"
                />
              </label>

              <label className="goat-abcc-import__field">
                <span>Nome</span>
                <input
                  type="text"
                  value={searchFilters.name}
                  onChange={(event) => onSearchFieldChange("name", event.target.value)}
                  placeholder="Nome do animal"
                />
              </label>

              <label className="goat-abcc-import__field">
                <span>Página</span>
                <input
                  type="number"
                  min="1"
                  value={searchFilters.page}
                  onChange={(event) => onSearchFieldChange("page", event.target.value)}
                />
              </label>

              <label className="goat-abcc-import__field">
                <span>Sexo</span>
                <select
                  value={searchFilters.sex}
                  onChange={(event) =>
                    onSearchFieldChange("sex", event.target.value as GoatAbccSearchFilters["sex"])
                  }
                >
                  <option value="">Todos</option>
                  <option value="1">Macho</option>
                  <option value="0">Fêmea</option>
                </select>
              </label>

              <label className="goat-abcc-import__field">
                <span>DNA</span>
                <select
                  value={searchFilters.dna}
                  onChange={(event) =>
                    onSearchFieldChange("dna", event.target.value as GoatAbccSearchFilters["dna"])
                  }
                >
                  <option value="">Todos</option>
                  <option value="1">Com DNA</option>
                  <option value="0">Sem DNA</option>
                </select>
              </label>

              <label className="goat-abcc-import__field">
                <span>TOD</span>
                <input
                  type="text"
                  value={searchFilters.tod}
                  onChange={(event) => onSearchFieldChange("tod", event.target.value)}
                  placeholder="Orelha direita"
                />
              </label>

              <label className="goat-abcc-import__field">
                <span>TOE</span>
                <input
                  type="text"
                  value={searchFilters.toe}
                  onChange={(event) => onSearchFieldChange("toe", event.target.value)}
                  placeholder="Orelha esquerda"
                />
              </label>
            </div>

            <div className="goat-abcc-import__actions">
              <Button variant="primary" onClick={onSearchSubmit} loading={searching}>
                Buscar animais
              </Button>
            </div>

            {searching && <LoadingState label="Consultando ABCC pública..." />}

            {!searching && searchError && (
              <ErrorState
                title="Não foi possível consultar a ABCC"
                description={searchError}
                onRetry={onSearchSubmit}
              />
            )}

            {!searching && !searchError && searched && searchItems.length === 0 && (
              <EmptyState
                title="Nenhum animal encontrado na ABCC"
                description="Revise os filtros de busca e tente novamente."
              />
            )}

            {!searching && !searchError && searchItems.length > 0 && (
              <div className="goat-abcc-import__result-list">
                {searchItems.map((item) => {
                  const isSelected = item.externalId === selectedExternalId;
                  return (
                    <article
                      key={item.externalId}
                      className={`goat-abcc-import__result-item ${isSelected ? "is-selected" : ""}`}
                    >
                      <div>
                        <h4>{item.nome || "Animal sem nome"}</h4>
                        <p>
                          {item.raca || "Raça não informada"} · {item.sexo || "Sexo não informado"} · {item.situacao || "Situação não informada"}
                        </p>
                        <small>
                          TOD/TOE: {(item.tod || "-") + (item.toe || "")} · Nascimento: {item.dataNascimento || "-"}
                        </small>
                        {!!item.normalizationWarnings?.length && (
                          <ul className="goat-abcc-import__warning-list">
                            {item.normalizationWarnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <Button
                        variant="secondary"
                        disabled={!item.externalId}
                        onClick={() => onSelectSearchItem(item)}
                      >
                        Pré-visualizar
                      </Button>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      <section className="goat-abcc-import__panel">
        <div className="goat-abcc-import__panel-head">
          <div>
            <h3>2. Pré-visualização e confirmação</h3>
            <p>Revise os dados antes de confirmar a criação do animal no CapriGestor.</p>
          </div>
        </div>

        {!selectedExternalId && (
          <EmptyState
            title="Selecione um animal na busca"
            description="Use o botão de pré-visualização para trazer os dados consolidados da ABCC."
          />
        )}

        {selectedExternalId && previewLoading && <LoadingState label="Carregando pré-visualização..." />}

        {selectedExternalId && !previewLoading && previewError && (
          <ErrorState
            title="Não foi possível carregar a pré-visualização"
            description={previewError}
          />
        )}

        {selectedExternalId && !previewLoading && !previewError && previewForm && (
          <div className="goat-abcc-import__preview-wrap">
            {previewData && (
              <div className="goat-abcc-import__preview-context">
                <div>
                  <span>Fonte</span>
                  <strong>{previewData.externalSource || "ABCC_PUBLIC"}</strong>
                </div>
                <div>
                  <span>Fazenda</span>
                  <strong>{previewData.farmName || "Fazenda atual"}</strong>
                </div>
                <div>
                  <span>Responsável</span>
                  <strong>{previewData.userName || "Usuário atual"}</strong>
                </div>
                <div>
                  <span>Nascimento</span>
                  <strong>{formatDate(previewData.birthDate)}</strong>
                </div>
              </div>
            )}

            {!!previewData?.normalizationWarnings?.length && (
              <Alert variant="warning" title="Atenção aos campos normalizados">
                <ul className="goat-abcc-import__warning-list">
                  {previewData.normalizationWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {confirmSuccess && (
              <Alert variant="success" title="Importação concluída com sucesso">
                {confirmSuccess}
              </Alert>
            )}

            {confirmError && (
              <Alert variant="error" title="Falha ao confirmar a importação">
                {confirmError}
              </Alert>
            )}

            <div className="goat-abcc-import__grid">
              <label className="goat-abcc-import__field">
                <span>Número de registro *</span>
                <input
                  type="text"
                  value={previewForm.registrationNumber}
                  onChange={(event) => onPreviewFieldChange("registrationNumber", event.target.value)}
                />
              </label>

              <label className="goat-abcc-import__field">
                <span>Nome *</span>
                <input
                  type="text"
                  value={previewForm.name}
                  onChange={(event) => onPreviewFieldChange("name", event.target.value)}
                />
              </label>

              <label className="goat-abcc-import__field">
                <span>Sexo *</span>
                <select
                  value={previewForm.genderLabel}
                  onChange={(event) =>
                    onPreviewFieldChange("genderLabel", event.target.value as GoatAbccPreviewFormData["genderLabel"])
                  }
                >
                  {UI_GENDER_LABELS.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="goat-abcc-import__field">
                <span>Raça *</span>
                <select
                  value={previewForm.breed}
                  onChange={(event) => onPreviewFieldChange("breed", event.target.value)}
                >
                  <option value="">Selecione a raça</option>
                  {BREED_OPTIONS.map((breed) => (
                    <option key={breed} value={breed}>
                      {breedLabels[breed]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="goat-abcc-import__field">
                <span>Cor *</span>
                <input
                  type="text"
                  value={previewForm.color}
                  onChange={(event) => onPreviewFieldChange("color", event.target.value)}
                />
              </label>

              <label className="goat-abcc-import__field">
                <span>Data de nascimento *</span>
                <input
                  type="date"
                  value={previewForm.birthDate}
                  onChange={(event) => onPreviewFieldChange("birthDate", event.target.value)}
                />
              </label>

              <label className="goat-abcc-import__field">
                <span>Status *</span>
                <select
                  value={previewForm.statusLabel}
                  onChange={(event) =>
                    onPreviewFieldChange("statusLabel", event.target.value as GoatAbccPreviewFormData["statusLabel"])
                  }
                >
                  {UI_STATUS_LABELS.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="goat-abcc-import__field">
                <span>Categoria</span>
                <select
                  value={previewForm.category}
                  onChange={(event) =>
                    onPreviewFieldChange("category", event.target.value as GoatAbccPreviewFormData["category"])
                  }
                >
                  {Object.values(GoatCategoryEnum).map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="goat-abcc-import__field">
                <span>TOD *</span>
                <input
                  type="text"
                  value={previewForm.tod}
                  onChange={(event) => onPreviewFieldChange("tod", event.target.value)}
                />
              </label>

              <label className="goat-abcc-import__field">
                <span>TOE *</span>
                <input
                  type="text"
                  value={previewForm.toe}
                  onChange={(event) => onPreviewFieldChange("toe", event.target.value)}
                />
              </label>

              <label className="goat-abcc-import__field">
                <span>Registro do pai</span>
                <input
                  type="text"
                  value={previewForm.fatherRegistrationNumber}
                  onChange={(event) =>
                    onPreviewFieldChange("fatherRegistrationNumber", event.target.value)
                  }
                />
              </label>

              <label className="goat-abcc-import__field">
                <span>Registro da mãe</span>
                <input
                  type="text"
                  value={previewForm.motherRegistrationNumber}
                  onChange={(event) =>
                    onPreviewFieldChange("motherRegistrationNumber", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="goat-abcc-import__actions goat-abcc-import__actions--confirm">
              <Button variant="success" loading={confirming} onClick={onConfirmImport}>
                Confirmar importação
              </Button>
            </div>
          </div>
        )}

        {!selectedExternalId && selectedItem && (
          <p className="goat-abcc-import__selected-tip">
            Animal selecionado: {selectedItem.nome}
          </p>
        )}
      </section>
    </div>
  );
}

export default function GoatAbccImportModal({
  isOpen,
  farmId,
  defaultTod,
  onClose,
  onImported,
}: GoatAbccImportModalProps) {
  const [raceOptions, setRaceOptions] = useState<GoatAbccRaceOptionDTO[]>([]);
  const [racesLoading, setRacesLoading] = useState(false);
  const [racesError, setRacesError] = useState<string | null>(null);

  const [searchFilters, setSearchFilters] = useState<GoatAbccSearchFilters>(initialSearchFilters);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchItems, setSearchItems] = useState<GoatAbccSearchItemDTO[]>([]);

  const [selectedExternalId, setSelectedExternalId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<GoatAbccPreviewResponseDTO | null>(null);
  const [previewForm, setPreviewForm] = useState<GoatAbccPreviewFormData | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);

  function resetFlow() {
    setSearchFilters(initialSearchFilters);
    setSearching(false);
    setSearched(false);
    setSearchError(null);
    setSearchItems([]);
    setSelectedExternalId(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setPreviewData(null);
    setPreviewForm(null);
    setConfirming(false);
    setConfirmError(null);
    setConfirmSuccess(null);
  }

  const loadRaceOptions = useCallback(async () => {
    try {
      setRacesLoading(true);
      setRacesError(null);

      const response = await listAbccRaceOptions(farmId);
      setRaceOptions(response.items ?? []);
    } catch (error) {
      setRacesError(getApiErrorMessage(parseApiError(error)));
      setRaceOptions([]);
    } finally {
      setRacesLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    if (isOpen) {
      resetFlow();
      void loadRaceOptions();
    }
  }, [isOpen, loadRaceOptions]);

  function handleSearchFieldChange<K extends keyof GoatAbccSearchFilters>(
    field: K,
    value: GoatAbccSearchFilters[K]
  ) {
    setSearchFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSearchSubmit() {
    if (!searchFilters.raceName.trim()) {
      setSearchError("Selecione a raça ABCC para buscar.");
      return;
    }

    if (!searchFilters.affix.trim()) {
      setSearchError("Informe o afixo para buscar na ABCC.");
      return;
    }

    try {
      setSearching(true);
      setSearched(false);
      setSearchError(null);
      setSearchItems([]);
      setSelectedExternalId(null);
      setPreviewData(null);
      setPreviewForm(null);
      setPreviewError(null);
      setConfirmError(null);
      setConfirmSuccess(null);

      const response = await searchGoatsByAbcc(farmId, buildSearchPayload(searchFilters, raceOptions));
      setSearchItems(response.items ?? []);
      setSearched(true);
    } catch (error) {
      setSearched(true);
      setSearchError(getApiErrorMessage(parseApiError(error)));
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectSearchItem(item: GoatAbccSearchItemDTO) {
    if (!item.externalId) {
      toast.error("Animal sem identificador externo. Não é possível abrir o preview.");
      return;
    }

    try {
      setSelectedExternalId(item.externalId);
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewData(null);
      setPreviewForm(null);
      setConfirmError(null);
      setConfirmSuccess(null);

      const response = await previewGoatFromAbcc(farmId, item.externalId);
      setPreviewData(response);
      setPreviewForm(buildPreviewFormData(response, defaultTod));
    } catch (error) {
      setPreviewError(getApiErrorMessage(parseApiError(error)));
    } finally {
      setPreviewLoading(false);
    }
  }

  function handlePreviewFieldChange<K extends keyof GoatAbccPreviewFormData>(
    field: K,
    value: GoatAbccPreviewFormData[K]
  ) {
    setPreviewForm((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        [field]: value,
      };
    });
  }

  async function handleConfirmImport() {
    if (!previewForm || !selectedExternalId) {
      setConfirmError("Selecione um animal e carregue a pré-visualização antes de confirmar.");
      return;
    }

    if (
      !previewForm.registrationNumber?.trim() ||
      !previewForm.name?.trim() ||
      !previewForm.breed?.trim() ||
      !previewForm.color?.trim() ||
      !previewForm.birthDate?.trim() ||
      !previewForm.tod?.trim() ||
      !previewForm.toe?.trim()
    ) {
      setConfirmError(
        "Preencha os campos obrigatórios (registro, nome, raça, cor, nascimento, TOD e TOE) antes de confirmar."
      );
      return;
    }

    try {
      setConfirming(true);
      setConfirmError(null);
      setConfirmSuccess(null);

      const payload = mapGoatToBackend(previewForm);
      const createdGoat = await confirmGoatImportFromAbcc(farmId, {
        externalId: selectedExternalId,
        goat: payload,
      });

      const successMessage = `Animal ${createdGoat.registrationNumber} importado com sucesso.`;
      setConfirmSuccess(successMessage);
      toast.success(successMessage);
      onImported();
    } catch (error) {
      const message = getApiErrorMessage(parseApiError(error));
      setConfirmError(message);
      toast.error(message);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar animal da ABCC"
      size="xl"
      className="goat-abcc-import__modal"
    >
      <GoatAbccImportModalView
        raceOptions={raceOptions}
        racesLoading={racesLoading}
        racesError={racesError}
        onRetryLoadRaces={loadRaceOptions}
        searchFilters={searchFilters}
        onSearchFieldChange={handleSearchFieldChange}
        onSearchSubmit={handleSearchSubmit}
        onResetFlow={resetFlow}
        searching={searching}
        searched={searched}
        searchError={searchError}
        searchItems={searchItems}
        selectedExternalId={selectedExternalId}
        onSelectSearchItem={handleSelectSearchItem}
        previewLoading={previewLoading}
        previewError={previewError}
        previewData={previewData}
        previewForm={previewForm}
        onPreviewFieldChange={handlePreviewFieldChange}
        onConfirmImport={handleConfirmImport}
        confirming={confirming}
        confirmError={confirmError}
        confirmSuccess={confirmSuccess}
      />
    </Modal>
  );
}

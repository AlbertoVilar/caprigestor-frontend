import { Link } from "react-router-dom";
import type {
  FarmGoatRegistryDisposition,
  FarmGoatRegistryGlobalStatus,
  FarmGoatRegistryResponseDTO,
  FarmGoatRegistryRole,
} from "../../../Models/FarmGoatRegistryDTOs";
import {
  buildGoatDetailPath,
  buildGoatTechnicalToken,
} from "../../../utils/appRoutes";

export const DISPOSITION_LABELS: Record<FarmGoatRegistryDisposition, string> = {
  CURRENT: "No rebanho atual",
  SOLD: "Vendido",
  TRANSFERRED: "Transferido",
  DONATED: "Doado",
  RETIRED: "Retirado",
  DECEASED: "Falecido",
  NONE: "Sem vínculo de propriedade registrado",
};

export const GLOBAL_STATUS_LABELS: Record<FarmGoatRegistryGlobalStatus, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  FALECIDO: "Falecido",
  VENDIDO: "Vendido",
};

export const ROLE_LABELS: Record<FarmGoatRegistryRole, string> = {
  CREATOR: "Criador",
  CURRENT_OWNER: "Proprietário atual",
  FORMER_OWNER: "Ex-proprietário",
};

interface Props {
  item: FarmGoatRegistryResponseDTO;
  routeFarmId: number;
}

export default function FarmGoatRegistryItemRow({ item, routeFarmId }: Props) {
  const isCurrentOwner = item.roles.includes("CURRENT_OWNER");

  const creatorDisplay = item.creatorNameSnapshot
    ? item.creatorNameSnapshot
    : "Não informado";

  const provenanceDisplay =
    item.creatorFarmId === routeFarmId
      ? "Criado nesta fazenda"
      : item.creatorFarmId != null
      ? `Fazenda #${item.creatorFarmId}`
      : null;

  const currentOwnerDisplay =
    item.currentOwnerFarmId === routeFarmId
      ? "Esta fazenda"
      : item.currentOwnerFarmId != null
      ? `Fazenda #${item.currentOwnerFarmId}`
      : "Sem propriedade atual registrada no CapriGestor";

  const operationalLink = isCurrentOwner
    ? buildGoatDetailPath(routeFarmId, buildGoatTechnicalToken(item.goatId))
    : null;

  return (
    <tr className="farm-goat-registry-row" data-goat-id={item.goatId}>
      <td data-label="Identificação" className="farm-goat-registry-cell--identity">
        <strong className="farm-goat-registry-name">{item.name}</strong>
        <span className="farm-goat-registry-rg">RG: {item.registrationNumber}</span>
      </td>

      <td data-label="Papéis">
        <div className="farm-goat-registry-roles">
          {item.roles.map((role) => (
            <span
              key={role}
              className={`farm-goat-registry-role farm-goat-registry-role--${role.toLowerCase()}`}
            >
              {ROLE_LABELS[role] ?? role}
            </span>
          ))}
        </div>
      </td>

      <td data-label="Situação">
        <div className="farm-goat-registry-statuses">
          <div className="farm-goat-registry-status-field">
            <span className="farm-goat-registry-status-caption">Estado global:</span>
            <span
              className={`farm-goat-registry-badge farm-goat-registry-badge--global-${item.globalStatus.toLowerCase()}`}
            >
              {GLOBAL_STATUS_LABELS[item.globalStatus] ?? item.globalStatus}
            </span>
          </div>
          <div className="farm-goat-registry-status-field">
            <span className="farm-goat-registry-status-caption">Relação com esta fazenda:</span>
            <span
              className={`farm-goat-registry-badge farm-goat-registry-badge--disp-${item.disposition.toLowerCase()}`}
            >
              {DISPOSITION_LABELS[item.disposition] ?? item.disposition}
            </span>
          </div>
        </div>
      </td>

      <td data-label="Criador registrado">
        <div className="farm-goat-registry-provenance">
          <span>{creatorDisplay}</span>
          {provenanceDisplay && (
            <span className="farm-goat-registry-subtag">{provenanceDisplay}</span>
          )}
        </div>
      </td>

      <td data-label="Proprietário atual">
        <span className="farm-goat-registry-owner">{currentOwnerDisplay}</span>
      </td>

      <td data-label="Ações" className="farm-goat-registry-cell--actions">
        {operationalLink ? (
          <Link
            to={operationalLink}
            className="btn btn-sm btn-outline-primary farm-goat-registry-action-link"
            aria-label={`Gerenciar animal ${item.name}`}
          >
            <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
            <span>Gerenciar</span>
          </Link>
        ) : (
          <span className="farm-goat-registry-readonly-badge">Somente leitura</span>
        )}
      </td>
    </tr>
  );
}

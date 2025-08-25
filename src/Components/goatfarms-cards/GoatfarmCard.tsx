import type { GoatFarmDTO } from "../../Models/goatFarm";
import ButtonCard from "../buttons/ButtonCard";
import ButtonLink from "../buttons/ButtonLink";
import "./goatfarmsCards.css";

import { useAuth } from "@/contexts/AuthContext";
import { RoleEnum } from "@/Models/auth";

type Props = {
  farm: GoatFarmDTO;
};

export default function GoatFarmCard({ farm }: Props) {
  const { isAuthenticated, tokenPayload } = useAuth();
  const roles = tokenPayload?.authorities ?? [];

  const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);
  const isOperator = roles.includes(RoleEnum.ROLE_OPERATOR);

  // Operador só pode gerenciar se for dono da fazenda
  const isOwnerOperator =
    isOperator && tokenPayload?.userId != null && tokenPayload.userId === farm.ownerId;

  const canEdit = isAuthenticated && (isAdmin || isOwnerOperator);
  const canDelete = isAuthenticated && isAdmin;

  return (
    <div className="goatfarm-card">
      <h3>{farm.name}</h3>

      <p>
        <strong>TOD:</strong> {farm.tod}
      </p>

      <p>
        <strong>Proprietário:</strong> {farm.ownerName}
      </p>

      <p className="address-line">
        <strong>Endereço:</strong>
        <br />
        {`${farm.street}, ${farm.district}, ${farm.city} - ${farm.state}`}
        <br />
        {`CEP: ${farm.cep}`}
      </p>

      <p>
        <strong>Telefones:</strong>{" "}
        {farm.phones?.map((phone) => (
          <span key={phone.id} className="phone-item">
            <i className="fa-solid fa-phone"></i> ({phone.ddd}) {phone.number}
          </span>
        ))}
      </p>

      {/* Ações */}
      <div className="card-buttons">
        {/* Detalhes: público (read-only) */}
        <ButtonLink to={`/cabras?farmId=${farm.id}`} label="🔍 Detalhes" />

        {/* Editar: somente logado & (admin || operador dono) */}
        {canEdit && (
          <ButtonLink
            to={`/fazendas/${farm.id}/editar`}
            label="Editar"
            className="edit"
          />
        )}

        {/* Excluir: somente admin */}
        {canDelete && (
          <ButtonCard
            name="Excluir"
            className="delete"
            // TODO: conecte aqui sua função de exclusão
          />
        )}
      </div>
    </div>
  );
}

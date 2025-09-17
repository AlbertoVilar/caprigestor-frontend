import type { GoatFarmDTO } from "../../Models/goatFarm";
import ButtonCard from "../buttons/ButtonCard";
import ButtonLink from "../buttons/ButtonLink";
import { Link } from "react-router-dom";
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
  // Garantindo que a comparação seja feita com tipos consistentes
  const isOwnerOperator =
    isOperator && 
    tokenPayload?.userId != null && 
    Number(tokenPayload.userId) === Number(farm.userId);

  // Lógica de permissões conforme documentação RBAC
  const canEdit = isAuthenticated && (isAdmin || isOwnerOperator);
  const canDelete = isAuthenticated && isAdmin;

  // DEBUG: Log para verificar o estado da autenticação
  console.log('🔍 GoatFarmCard Debug:', {
    isAuthenticated,
    roles,
    isAdmin,
    isOperator,
    tokenPayload: tokenPayload ? {
      userId: tokenPayload.userId,
      authorities: tokenPayload.authorities,
      exp: tokenPayload.exp,
      expDate: new Date(tokenPayload.exp * 1000)
    } : null,
    farm: {
      id: farm.id,
      userId: farm.userId,
      name: farm.name
    },
    canEdit,
    isOwnerOperator
  });

  return (
    <Link to={`/cabras?farmId=${farm.id}`} className="goatfarm-card-link">
      <div className="goatfarm-card">
        <h3>{farm.name}</h3>

        <p>
          <strong>TOD:</strong> {farm.tod}
        </p>

        <p>
          <strong>Proprietário:</strong> {farm.userName}
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
        <div className="card-buttons-farm" onClick={(e) => e.stopPropagation()}>
          {/* Detalhes: público (read-only) */}
          <ButtonLink to={`/cabras?farmId=${farm.id}`} label="🔍 Detalhes" className="btn-link" />

          {/* Editar: somente logado & (admin || operador dono) */}
          {canEdit && (
            <ButtonLink
              to={`/fazendas/${farm.id}/editar`}
              label="✏️ Editar"
              className="edit"
            />
          )}

          {/* Excluir: somente admin */}
          {canDelete && (
            <ButtonCard
              name="🗑️ Excluir"
              className="delete"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              // TODO: conecte aqui sua função de exclusão
            />
          )}
        </div>
      </div>
    </Link>
  );
}

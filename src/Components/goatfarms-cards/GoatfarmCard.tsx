import type { GoatFarmDTO } from "../../Models/goatFarm";
import ButtonCard from "../buttons/ButtonCard";
import ButtonLink from "../buttons/ButtonLink";
import "./goatfarmsCards.css";

import { usePermissions } from "@/Hooks/usePermissions";

type Props = {
  farm: GoatFarmDTO;
};

export default function GoatFarmCard({ farm }: Props) {
  const { canManage, canDelete } = usePermissions({ farmOwnerId: farm.userId || farm.ownerId });

  return (
    <div className="goatfarm-card">
      <h3>{farm.name}</h3>

      <p>
        <strong>TOD:</strong> {farm.tod}
      </p>

      <p>
        <strong>Proprietário:</strong> {farm.user?.name || farm.ownerName}
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

      <div className="card-buttons">
        <ButtonLink to={`/cabras/${farm.id}`} label="🔍 Detalhes" />

        {/* Botão de edição: dono ou admin */}
        {canManage && (
          <ButtonLink
            to={`/fazendas/${farm.id}/editar`}
            label="Editar"
            className="edit"
          />
        )}
        
        {/* Botão de exclusão: apenas admin */}
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

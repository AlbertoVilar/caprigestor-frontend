import ButtonCard from "../buttons/ButtonCard";
import ButtonLink from "../buttons/ButtonLink";
import "../../index.css";
import "./goatfarmsCards.css";
import type { GoatFarmDTO } from "../../Models/goatFarm";

type Props = {
  farm: GoatFarmDTO;
};

export default function GoatFarmCard({ farm }: Props) {
  return (
    <div className="goatfarm-card">
      <h3>{farm.name}</h3>

      <p>
        <strong>TOD:</strong> {farm.tod}
      </p>
      <p>
        <strong>Proprietário:</strong> {farm.ownerName}
      </p>
      <p>
        <strong>Endereço:</strong>{" "}
        {`${farm.street}, ${farm.district}, ${farm.city} - ${farm.state} (${farm.cep})`}
      </p>
      <p>
      <strong>Telefones:</strong>{" "}
      {farm.phones.map((phone) => (
        <span key={phone.id} className="phone-item">
          <i className="fa-solid fa-phone"></i>
          ({phone.ddd}) {phone.number}
        </span>
      ))}
    </p>


      <div className="card-buttons">
        <ButtonLink to={`/goats/${farm.tod}`} label="Ver detalhes" />
        <ButtonCard name="Editar" className="edit" />
        <ButtonCard name="Excluir" className="delete" />
      </div>
    </div>
  );
}

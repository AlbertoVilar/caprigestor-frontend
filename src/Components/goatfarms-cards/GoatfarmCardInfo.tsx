import "../../index.css";
import ButtonCard from "../buttons/ButtonCard";
import "./goatfarmsCards.css";

export default function GoatFarmCard() {
  return (
    <div className="goatfarm-card">
      <h3>Capril Vilar</h3>

      <p>
        <strong>TOD:</strong> 16432
      </p>
      <p>
        <strong>Proprietário:</strong> Alberto Vilar
      </p>
      <p>
        <strong>Endereço:</strong> Sítio São Felix, Zona Rural, Santo Andre -
        Paraíba (58670-000)
      </p>
      <p>
        <strong>Telefones:</strong> (21) 98988-2934
      </p>

      <div className="card-buttons">
        <a className="btn-link" href="#">
          Ver detalhes
        </a>
        <div btn-edit>
          <ButtonCard />
        </div>
          <ButtonCard />
      </div>
    </div>
  );
}

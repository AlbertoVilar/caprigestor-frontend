import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";

import GoatEventList from "../../Components/events/GoatEventList";
import SearchFilter from "../../Components/searchs/SearchFilter";

import "../../index.css";
import "./goatEventPage.css";

export default function GoatEventsPage() {
  const { registrationNumber } = useParams<{ registrationNumber: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    type: "",
    startDate: "",
    endDate: "",
  });

  return (
    <div className="content-in">
      {/* Cabeçalho com título e botão de voltar na mesma linha */}
      <div className="events-header-line">
        <h2 className="title">Eventos do Animal</h2>
        <button className="btn-primary" onClick={() => navigate(-1)}>
          🔙 Voltar para Dashboard
        </button>
      </div>

      {/* Filtro com largura total igual à da tabela */}
      <div className="box">
        <SearchFilter onFilter={setFilters} />
      </div>

      {registrationNumber ? (
        <GoatEventList
          registrationNumber={registrationNumber}
          farmId={Number(searchParams.get("farmId"))}
          filters={filters}
        />
      ) : (
        <p className="error-text">
          Número de registro da cabra não encontrado na URL.
        </p>
      )}
    </div>
  );
}

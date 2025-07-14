import { useState } from "react";
import ButtonPrimary from "../buttons/ButtonPrimary"; // ✅ Importa seu botão padrão
import "./SearchFilter.css";

interface Props {
  onFilter: (filters: {
    type: string;
    startDate: string;
    endDate: string;
  }) => void;
}

export default function SearchFilter({ onFilter }: Props) {
  const [type, setType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSearch = () => {
    onFilter({ type, startDate, endDate });
  };

  return (
    <div className="search-filter-container">
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="">Todos os tipos</option>
        <option value="COBERTURA">Cobertura</option>
        <option value="PARTO">Parto</option>
        <option value="VACINACAO">Vacinação</option>
        <option value="SAUDE">Saúde</option>
        <option value="PESAGEM">Pesagem</option>
        <option value="TRANSFERENCIA">Transferência</option>
        <option value="MUDANCA_PROPRIETARIO">Mudança de Proprietário</option>
        <option value="MORTE">Morte</option>
        <option value="OUTRO">Outro</option>
      </select>

      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />

      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />

      <ButtonPrimary label="Buscar" onClick={handleSearch} icon="fa-solid fa-search" />
    </div>
  );
}

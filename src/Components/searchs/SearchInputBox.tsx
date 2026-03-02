import { useId, useState } from "react";
import "../../index.css"; // garante acesso as classes globais
import "./searchinput.css";

interface Props {
  onSearch: (term: string) => void;
  placeholder?: string; // opcional
}

export default function SearchInputBox({ onSearch, placeholder }: Props) {
  const [term, setTerm] = useState("");
  const inputId = useId();
  const accessibleLabel = placeholder || "Buscar";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(term.trim());
  };

  return (
    <form className="search-container-box" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor={inputId}>
        {accessibleLabel}
      </label>
      <div className="search-box">
        <input
          id={inputId}
          type="text"
          placeholder={placeholder || "Buscar..."}
          aria-label={accessibleLabel}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button type="submit" className="search-button" aria-label="Buscar">
          <i className="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>
    </form>
  );
}

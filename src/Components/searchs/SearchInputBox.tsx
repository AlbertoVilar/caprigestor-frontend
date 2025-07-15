import { useState } from "react";
import "../../index.css"; // garante acesso às classes globais

interface Props {
  onSearch: (term: string) => void;
  placeholder?: string; // opcional
}

export default function SearchInputBox({ onSearch, placeholder }: Props) {
  const [term, setTerm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(term.trim());
  };

  return (
    <form className="search-container-box" onSubmit={handleSubmit}>
      <div className="search-box">
        <input
          type="text"
          placeholder={placeholder || "🔍 Buscar..."}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button type="submit" className="search-button">🔍</button>
      </div>
    </form>
  );
}

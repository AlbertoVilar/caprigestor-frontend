import { useState } from "react";
import "../../index.css"; // garante acesso às classes globais

interface Props {
  onSearch: (term: string) => void;
}

export default function SearchInputBox({ onSearch }: Props) {
  const [term, setTerm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(term.trim());
  };

  return (
    <form className="search-box" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="🔍 Buscar por nome..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <button type="submit" className="search-button">🔍</button>
    </form>
  );
}

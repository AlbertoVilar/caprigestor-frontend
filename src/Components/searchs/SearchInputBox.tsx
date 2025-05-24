import { useState } from "react";
import "../../index.css";
import "./searchinput.css";

interface Props {
  onSearch: (text: string) => void;
}

export default function SearchInputBox({ onSearch }: Props) {
  const [search, setSearch] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchClick = () => {
    onSearch(search.trim());
  };

  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="🔍 Buscar por nome..."
        value={search}
        onChange={handleInputChange}
      />
      <button className="search-button" onClick={handleSearchClick}>
        <i className="fa-solid fa-search"></i>
      </button>
    </div>
  );
}

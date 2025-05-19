import "../../index.css";
import "./searchinput.css"

export default function SearchCapril() {
  return (
    <div className="search-box">
      <input type="text" placeholder="🔍 Buscar capril por nome..." />
      <button className="search-button">
        <i className="fa-solid fa-search"></i>
      </button>
    </div>
  );
}

import "../index.css";

export default function SearchCapril() {
  return (
    <div className="search-box">
      <input type="text" placeholder="🔍 Buscar capril por nome..." />
      <button className="search-button">
        <i className="fa-solid fa-search">Buscar</i>
      </button>
    </div>
  );
}

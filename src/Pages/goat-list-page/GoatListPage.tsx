
import PageHeader from "../../Components/pages-headers/PageHeader";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";

import "../../index.css";
import "./goatList.css"; 

export default function GoatListPage() {
  return (
    <>
      <PageHeader title="Lista de Cabras" />

      <div className="goat-section">
        <div className="goat-header">
          <h2>Cabras</h2>
          <button className="btn-new-goat">Cadastrar nova cabra</button>
        </div>

        <input
          type="text"
          className="goat-search"
          placeholder="Buscar por nome"
          // TODO: conectar à filtragem
        />

        <GoatCardList />
      </div>
    </>
  );
}

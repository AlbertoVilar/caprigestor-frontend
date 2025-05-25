import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../Components/pages-headers/PageHeader";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import SearchInputBox from "../../Components/searchs/SearchInputBox";

import type { GoatDTO } from "../../Models/goatDTO";
import { getGoatsByFarmId } from "../../api/GoatFarmAPI/goatFarm";
import { searchGoatsByNameAndFarmId } from "../../api/GoatAPI/goat";

import "../../index.css";
import "./goatList.css";

export default function GoatListPage() {
  const [goats, setGoats] = useState<GoatDTO[]>([]); // Todas as cabras carregadas inicialmente
  const [filteredGoats, setFilteredGoats] = useState<GoatDTO[]>([]); // Cabras a serem exibidas (filtradas ou não)
  const [searchParams] = useSearchParams(); // Para extrair o farmId da URL

  // Carrega as cabras da fazenda ao montar o componente
  useEffect(() => {
    const farmId = searchParams.get("farmId");
    if (farmId) {
      getGoatsByFarmId(Number(farmId))
        .then((data) => {
          setGoats(data); // Salva todas as cabras localmente
          setFilteredGoats(data); // Exibe todas inicialmente
        })
        .catch((err) => console.error("Erro ao buscar cabras:", err));
    }
  }, [searchParams]);

  // Lida com a busca por nome, local e no backend
  const handleSearch = async (term: string) => {
    const farmId = searchParams.get("farmId");
    if (!farmId) return;

    // Primeiro tenta buscar localmente
    const localMatches = goats.filter((goat) =>
      goat.name.toLowerCase().includes(term.toLowerCase())
    );

    if (localMatches.length > 0) {
      setFilteredGoats(localMatches); // Exibe as que já estavam carregadas
    } else {
      // Se não encontrou localmente, busca no backend
      try {
        const backendResults = await searchGoatsByNameAndFarmId(Number(farmId), term);
        setFilteredGoats(backendResults);
      } catch (err) {
        console.error("Erro ao buscar no backend:", err);
      }
    }
  };

  return (
    <>
      <PageHeader title="Lista de Cabras" />

      <div className="goat-section">
        <div className="goat-header">
          <h2>Cabras</h2>
          <button className="btn-new-goat">Cadastrar nova cabra</button>
        </div>

        {/* Componente de busca que chama handleSearch ao clicar no botão */}
        <SearchInputBox onSearch={handleSearch} />

        {/* Lista renderizada com as cabras filtradas */}
        <GoatCardList goats={filteredGoats} />

        <ButtonSeeMore />
      </div>
    </>
  );
}

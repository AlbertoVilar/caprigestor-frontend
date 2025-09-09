import { useEffect, useState } from "react";
import { getAllFarmsPaginated } from "../../api/GoatFarmAPI/goatFarm";
import type { GoatFarmDTO } from "../../Models/goatFarm";

import SearchInputBox from "../../Components/searchs/SearchInputBox";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import GoatFarmCardList from "../../Components/goat-farm-card-list/GoatFarmCardList";

import "../../index.css";
import "./listfarms.css"

export default function ListFarms() {
  const [farms, setFarms] = useState<GoatFarmDTO[]>([]);
  const [filteredFarms, setFilteredFarms] = useState<GoatFarmDTO[]>([]);
  const [, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  useEffect(() => {
    loadFarmsPage(0);
  }, []);

  const loadFarmsPage = (pageToLoad: number) => {
    console.log('=== DEBUG FAZENDAS ===');
    console.log('Carregando página:', pageToLoad);
    console.log('PAGE_SIZE:', PAGE_SIZE);
    
    getAllFarmsPaginated(pageToLoad, PAGE_SIZE)
      .then((data) => {
        console.log('Resposta da API:', data);
        console.log('Fazendas recebidas:', data.content);
        console.log('Total de fazendas:', data.content?.length);
        
        const newFarms = data.content;
        if (pageToLoad === 0) {
          setFarms(newFarms);
        } else {
          setFarms((prev) => [...prev, ...newFarms]);
        }

        setFilteredFarms((prev) =>
          pageToLoad === 0 ? newFarms : [...prev, ...newFarms]
        );

        setPage(data.page.number);
        setHasMore(data.page.number + 1 < data.page.totalPages);
        console.log('Estado atualizado - farms:', newFarms.length, 'hasMore:', data.page.number + 1 < data.page.totalPages);
      })
      .catch((err) => {
        console.error("Erro ao buscar fazendas:", err);
        console.error('Detalhes do erro:', err.response?.data);
        console.error('Status do erro:', err.response?.status);
      });
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = farms.filter((farm) =>
      farm.name.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredFarms(filtered);
  };

  const handleSeeMore = () => {
    loadFarmsPage(page + 1);
  };

  return (
    <div>
      <SearchInputBox onSearch={handleSearch} placeholder="🔍 Buscar fazenda por nome..." />
      <GoatFarmCardList farms={filteredFarms} />
      {hasMore && <ButtonSeeMore onClick={handleSeeMore} />}
    </div>
  );
}

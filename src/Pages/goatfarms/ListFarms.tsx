import { useEffect, useState } from "react";
import { getAllFarmsPaginated } from "../../api/GoatFarmAPI/goatFarm";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";

import SearchInputBox from "../../Components/searchs/SearchInputBox";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import GoatFarmCardList from "../../Components/goat-farm-card-list/GoatFarmCardList";

import "../../index.css";
import "./listfarms.css"

export default function ListFarms() {
  const [farms, setFarms] = useState<GoatFarmDTO[]>([]);
  const [filteredFarms, setFilteredFarms] = useState<GoatFarmDTO[]>([]);
  const [, setSearchTerm] = useState("");
  const { tokenPayload } = useAuth();
  const permissions = usePermissions();

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  useEffect(() => {
    loadFarmsPage(0);
  }, []);

  const loadFarmsPage = (pageToLoad: number) => {
    getAllFarmsPaginated(pageToLoad, PAGE_SIZE)
      .then((data) => {
        let newFarms = data.content;
        
        // Filtrar fazendas baseado no papel do usuário
        if (!permissions.isAdmin() && tokenPayload?.userId) {
          // Operadores e proprietários só veem suas próprias fazendas
          newFarms = newFarms.filter(farm => farm.userId === tokenPayload.userId);
        }
        
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
      })
      .catch((err) => console.error("Erro ao buscar fazendas:", err));
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

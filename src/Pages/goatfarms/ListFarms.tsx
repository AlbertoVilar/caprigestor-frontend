import { useEffect, useState } from "react";
import { getAllFarms } from "../../api/GoatFarmAPI/goatFarm";
import type { GoatFarmDTO } from "../../Models/goatFarm";

import SearchInputBox from "../../Components/searchs/SearchInputBox";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import GoatFarmCardList from "../../Components/goat-farm-card-list/GoatFarmCardList";

import "../../index.css";
import "./listfarms.css";

export default function ListFarms() {
  const [farms, setFarms] = useState<GoatFarmDTO[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getAllFarms()
      .then((data) => setFarms(data))
      .catch((err) => console.error("Erro ao buscar fazendas:", err));
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const filteredFarms = farms.filter((farm) =>
    farm.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <SearchInputBox
        onSearch={handleSearch}
        placeholder="🔍 Buscar fazenda por nome..."
      />
      <GoatFarmCardList farms={filteredFarms} />
      <ButtonSeeMore />
    </div>
  );
}

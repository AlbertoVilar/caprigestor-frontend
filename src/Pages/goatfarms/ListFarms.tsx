import { useEffect, useState } from "react";
import { getAllFarms } from "../../api/GoatFarmAPI/goatFarm";
import type { GoatFarmDTO } from "../../Models/goatFarm";

import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import GoatfarmCardInfo from "../../Components/goatfarms-cards/GoatfarmCardInfo";
import SearchInputBox from "../../Components/searchs/SearchInputBox";

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

  // Filtro simples ignorando maiúsculas/minúsculas
  const filteredFarms = farms.filter((farm) =>
    farm.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <SearchInputBox onSearch={setSearchTerm} />

      <div className="goatfarm-list">
        { filteredFarms.map((farm) => (
           <GoatfarmCardInfo key={farm.id} farm={farm} />
        )) }
      </div>

      <ButtonSeeMore />
    </div>
  );
}

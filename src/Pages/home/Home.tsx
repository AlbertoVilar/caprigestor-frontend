import { useEffect, useState } from "react";
import WelcomeSection from "../../Components/welcome section/WelcomeSection";
import "./home.css";
import { getAllFarms } from "../../api/GoatFarmAPI/goatFarm";
import type { GoatFarmDTO } from "../../Models/goatFarm";

export default function Home() {
  const [farms, setFarms] = useState<GoatFarmDTO[]>([]); // ✅ estado adicionado

  useEffect(() => {
    getAllFarms()
      .then(data => setFarms(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="home-wrapper">
      <WelcomeSection farms={farms} /> {/* ✅ passa os dados para o componente */}
    </div>
  );
}

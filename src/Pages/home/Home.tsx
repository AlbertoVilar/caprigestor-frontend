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
      .catch(err => {
        // Erro 401 é esperado para usuários não autenticados
        // A página Home deve funcionar mesmo sem dados das fazendas
        if (err.response?.status === 401) {
          console.log('Usuário não autenticado - página Home carregada sem dados das fazendas');
        } else {
          console.error('Erro ao carregar fazendas:', err);
        }
      });
  }, []);

  return (
    <div className="home-wrapper">
      <WelcomeSection farms={farms} /> {/* ✅ passa os dados para o componente */}
    </div>
  );
}

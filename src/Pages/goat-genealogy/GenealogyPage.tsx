import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import GoatGenealogyTree from "../../Components/goat-genealogy/GoatGenealogyTree";
import { getGenealogyByRegistration } from "../../api/GenealogyAPI/genealogy";

export default function GenealogyPage() {
  const { registrationNumber } = useParams<{ registrationNumber: string }>();
  const [genealogyData, setGenealogyData] = useState<GoatGenealogyDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (registrationNumber) {
      getGenealogyByRegistration(registrationNumber)
        .then((data) => {
          setGenealogyData(data);
        })
        .catch(() => {
          setError("Erro ao carregar a genealogia.");
        })
        .finally(() => setLoading(false));
    }
  }, [registrationNumber]);

  return (
    <div className="genealogy-page">
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
        🧬 Genealogia do animal {registrationNumber}
      </h2>

      {loading && <p style={{ textAlign: "center" }}>Carregando...</p>}
      {error && <p style={{ textAlign: "center", color: "red" }}>{error}</p>}
      {genealogyData && <GoatGenealogyTree data={genealogyData} />}
    </div>
  );
}

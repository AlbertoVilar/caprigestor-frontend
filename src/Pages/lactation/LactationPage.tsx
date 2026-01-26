import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LactationManager from "../../Components/lactation/LactationManager";
import { fetchGoatByRegistrationNumber, findGoatsByFarmIdPaginated } from "../../api/GoatAPI/goat";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import "../../index.css";

export default function LactationPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGoat() {
      if (!farmId || !goatId) return;

      try {
        setLoading(true);
        // Tenta buscar por ID na lista da fazenda (já que não temos endpoint getById público fácil, 
        // ou usamos o findGoatsByFarmIdPaginated se soubermos o registro... 
        // Mas espere, o goatId na URL é o ID numérico? 
        // O user disse /goats/:goatId. Assumo que seja o ID numérico.
        // Se não tiver endpoint getById, teremos que improvisar ou assumir que existe.
        // O arquivo goat.ts tem fetchGoatByRegistrationNumber. 
        // Mas a URL usa ID.
        
        // Vamos tentar buscar na lista da fazenda filtrando pelo ID se necessário, 
        // ou melhor, vamos implementar um fetchById se não existir, ou usar o que temos.
        // O arquivo goat.ts não tinha fetchById exportado explicitamente, 
        // mas tinha fetchGoatByRegistrationNumber.
        
        // Se a URL é .../goats/:goatId, precisamos buscar esse goat.
        // Vou buscar a lista da fazenda e encontrar o goat lá por enquanto, 
        // ou se o goatId for registrationNumber (o que seria comum em urls amigaveis, mas o nome diz goatId).
        // Vou assumir que goatId é o ID numérico.
        
        const response = await findGoatsByFarmIdPaginated(Number(farmId), 0, 100);
        const found = response.content.find(g => String(g.id) === goatId);
        
        if (found) {
          setGoat(found);
        } else {
          toast.error("Animal não encontrado na fazenda.");
          navigate("/dashboard"); 
        }
      } catch (error) {
        console.error("Erro ao carregar animal", error);
        toast.error("Erro ao carregar dados do animal");
      } finally {
        setLoading(false);
      }
    }

    loadGoat();
  }, [farmId, goatId, navigate]);

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
      </div>
    );
  }

  if (!goat) return null;

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <div className="page-header mb-4">
        <button className="btn-secondary mb-2" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <h2>Gerenciamento de Lactação</h2>
        <p className="text-muted">
          Animal: <strong>{goat.name || goat.registrationNumber}</strong> (Registro: {goat.registrationNumber})
        </p>
      </div>

      <div className="page-content">
        <LactationManager 
          farmId={Number(farmId)} 
          goatId={Number(goatId)} 
          goatName={goat.name || goat.registrationNumber} 
        />
      </div>
    </div>
  );
}

import { useParams, useNavigate } from "react-router-dom";

export default function MilkProductionPage() {
  const { farmId, goatId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <button className="btn-secondary mb-3" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left"></i> Voltar
      </button>
      <h2>Produção de Leite</h2>
      <p>Gerenciamento de produção de leite para o animal ID: {goatId}</p>
      
      <div className="alert alert-info">
        <i className="fa-solid fa-info-circle"></i> Módulo em desenvolvimento.
      </div>
    </div>
  );
}

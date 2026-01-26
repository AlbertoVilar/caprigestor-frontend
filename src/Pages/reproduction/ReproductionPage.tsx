import { useParams, useNavigate } from "react-router-dom";

export default function ReproductionPage() {
  const { farmId, goatId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <button className="btn-secondary mb-3" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left"></i> Voltar
      </button>
      <h2>Reprodução</h2>
      <p>Dashboard de reprodução para o animal ID: {goatId}</p>
      
      <div className="repro-tabs" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn-primary">Coberturas</button>
        <button className="btn-secondary">Prenhez Ativa</button>
        <button className="btn-secondary">Histórico</button>
      </div>

      <div className="alert alert-info mt-4">
        <i className="fa-solid fa-info-circle"></i> Módulo em desenvolvimento.
      </div>
    </div>
  );
}

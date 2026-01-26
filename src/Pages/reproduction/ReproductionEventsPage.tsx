import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ReproductionEventsPage() {
  const { farmId, goatId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container p-4">
      <button onClick={() => navigate(-1)} className="btn-secondary mb-4">Voltar</button>
      <h2>Timeline de Eventos Reprodutivos</h2>
      <p>Histórico completo de eventos...</p>
    </div>
  );
}

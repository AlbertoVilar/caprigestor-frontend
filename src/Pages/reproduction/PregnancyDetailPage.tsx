import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function PregnancyDetailPage() {
  const { farmId, goatId, pregnancyId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container p-4">
      <button onClick={() => navigate(-1)} className="btn-secondary mb-4">Voltar</button>
      <h2>Detalhe da Prenhez #{pregnancyId}</h2>
      <p>Dados da gestação...</p>
    </div>
  );
}

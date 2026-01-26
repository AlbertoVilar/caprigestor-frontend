import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function LactationActivePage() {
  const { farmId, goatId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container p-4">
      <button onClick={() => navigate(-1)} className="btn-secondary mb-4">Voltar</button>
      <h2>Detalhe da Lactação Ativa</h2>
      <p>Detalhes da lactação corrente para o animal {goatId}...</p>
    </div>
  );
}

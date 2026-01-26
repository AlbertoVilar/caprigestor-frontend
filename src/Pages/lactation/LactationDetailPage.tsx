import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function LactationDetailPage() {
  const { farmId, goatId, lactationId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container p-4">
      <button onClick={() => navigate(-1)} className="btn-secondary mb-4">Voltar</button>
      <h2>Detalhe da Lactação #{lactationId}</h2>
      <p>Histórico e dados da lactação finalizada...</p>
    </div>
  );
}

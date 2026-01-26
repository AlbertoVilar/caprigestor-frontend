import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function MilkProductionPage() {
  const { farmId, goatId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container p-4">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <h2 className="text-xl font-bold">Produção de Leite</h2>
      </div>
      <div className="card p-6 bg-white rounded shadow">
        <p className="text-gray-600">
          Módulo de controle de produção leiteira em desenvolvimento.
          <br/>
          Farm: {farmId}, Goat: {goatId}
        </p>
        <div className="mt-4">
           {/* Future: List of milk productions */}
           <button className="btn-primary">
             <i className="fa-solid fa-plus"></i> Registrar Pesagem
           </button>
        </div>
      </div>
    </div>
  );
}

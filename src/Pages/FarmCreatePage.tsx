// 🏡 Página de Cadastro de Fazenda

import React from 'react';
import { CreateFarmForm } from '../Components/CreateFarmForm';
import './farms-creted/FarmCreatePage.css';

/**
 * Página principal para cadastro de fazenda
 * Utiliza o componente CreateFarmForm para renderizar o formulário
 */
export const FarmCreatePage: React.FC = () => {
  return (
    <div className="farm-create-page">
      <div className="page-title">
        <h1>🏡 Cadastro de Fazenda</h1>
        <p>Registre sua fazenda no sistema de gestão de caprinos</p>
      </div>
      
      <div className="form-wrapper">
        <CreateFarmForm />
      </div>
    </div>
  );
};

export default FarmCreatePage;
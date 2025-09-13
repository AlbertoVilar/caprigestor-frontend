import React, { useState } from 'react';
import GoatCreateForm from '../../Components/goat-create-form/GoatCreateForm';
import { GoatCategoryEnum, GoatStatusEnum, GoatGenderEnum } from '../../types/goatEnums';
import './TestGoatRegistration.css';

interface TestGoatRegistrationProps {}

const TestGoatRegistration: React.FC<TestGoatRegistrationProps> = () => {
  const [showForm, setShowForm] = useState(false);
  const [lastCreatedGoat, setLastCreatedGoat] = useState<string | null>(null);

  // Dados de exemplo para teste
  const defaultFarmId = 1;
  const defaultUserId = 1;
  const defaultTod = "001";

  const handleGoatCreated = () => {
    setLastCreatedGoat(`Cabra cadastrada com sucesso em ${new Date().toLocaleString()}`);
    setShowForm(false);
    // Aqui você pode adicionar lógica para atualizar a lista de cabras
  };

  return (
    <div className="test-goat-registration">
      <div className="test-header">
        <h1>🐐 Teste de Cadastro de Cabras</h1>
        <p>Esta página demonstra o funcionamento do formulário de cadastro de cabras.</p>
      </div>

      <div className="test-info">
        <h2>📋 Informações do Sistema</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>Categorias Disponíveis</h3>
            <ul>
              <li><strong>PO:</strong> Puro de Origem</li>
              <li><strong>PA:</strong> Puro por Avaliação</li>
              <li><strong>PC:</strong> Puro por Cruza</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h3>Status Disponíveis</h3>
            <ul>
              <li><strong>ATIVO:</strong> Animal ativo</li>
              <li><strong>INATIVO:</strong> Animal inativo</li>
              <li><strong>MORTO:</strong> Animal morto</li>
              <li><strong>VENDIDO:</strong> Animal vendido</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h3>Gêneros</h3>
            <ul>
              <li><strong>MALE:</strong> Macho</li>
              <li><strong>FEMALE:</strong> Fêmea</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h3>Raças Disponíveis</h3>
            <ul>
              <li>Alpine</li>
              <li>Alpina</li>
              <li>Anglo-Nubiana</li>
              <li>Boer</li>
              <li>Mestiça</li>
              <li>Murciana-Granadina</li>
              <li>Saanen</li>
              <li>Toggenburg</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="test-actions">
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '❌ Fechar Formulário' : '➕ Abrir Formulário de Cadastro'}
        </button>
      </div>

      {lastCreatedGoat && (
        <div className="success-message">
          <p>✅ {lastCreatedGoat}</p>
        </div>
      )}

      {showForm && (
        <div className="form-container">
          <h2>📝 Formulário de Cadastro</h2>
          <GoatCreateForm
            onGoatCreated={handleGoatCreated}
            defaultFarmId={defaultFarmId}
            defaultUserId={defaultUserId}
            defaultTod={defaultTod}
          />
        </div>
      )}

      <div className="test-notes">
        <h2>📝 Notas Importantes</h2>
        <ul>
          <li>O número de registro é gerado automaticamente combinando TOD + TOE</li>
          <li>Os valores dos enums devem corresponder exatamente aos do backend</li>
          <li>A data de nascimento deve estar no formato YYYY-MM-DD</li>
          <li>Os campos obrigatórios são: nome, gênero, raça, status, TOD, TOE, farmId e userId</li>
          <li>Os campos de genealogia (pai e mãe) são opcionais</li>
        </ul>
      </div>
    </div>
  );
};

export default TestGoatRegistration;
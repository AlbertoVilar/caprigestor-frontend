import React, { useState } from 'react';
import { getAllFarms, getAllFarmsPaginated } from '../../api/GoatFarmAPI/goatFarm';
import type { GoatFarmDTO } from '../../Models/goatFarm';
import './TestFarms.css';

export default function TestFarmsPage() {
  const [farms, setFarms] = useState<GoatFarmDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testGetAllFarms = async () => {
    setLoading(true);
    setError(null);
    addLog('Iniciando teste getAllFarms()');
    
    try {
      addLog('Fazendo requisição para /goatfarms');
      const result = await getAllFarms();
      addLog(`Sucesso! Recebidas ${result.length} fazendas`);
      setFarms(result);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Erro desconhecido';
      const statusCode = err.response?.status || 'N/A';
      addLog(`Erro ${statusCode}: ${errorMsg}`);
      setError(`Erro ${statusCode}: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetAllFarmsPaginated = async () => {
    setLoading(true);
    setError(null);
    addLog('Iniciando teste getAllFarmsPaginated()');
    
    try {
      addLog('Fazendo requisição para /goatfarms com paginação');
      const result = await getAllFarmsPaginated(0, 5);
      addLog(`Sucesso! Recebidas ${result.content.length} fazendas (página 1)`);
      setFarms(result.content);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Erro desconhecido';
      const statusCode = err.response?.status || 'N/A';
      addLog(`Erro ${statusCode}: ${errorMsg}`);
      setError(`Erro ${statusCode}: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setError(null);
    setFarms([]);
  };

  return (
    <div className="test-farms-page">
      <h1>🧪 Teste de Busca de Fazendas</h1>
      <p>Esta página permite testar as requisições para a API de fazendas e identificar problemas.</p>
      
      <div className="test-controls">
        <button 
          onClick={testGetAllFarms} 
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Testando...' : 'Testar getAllFarms()'}
        </button>
        
        <button 
          onClick={testGetAllFarmsPaginated} 
          disabled={loading}
          className="btn btn-secondary"
        >
          {loading ? 'Testando...' : 'Testar getAllFarmsPaginated()'}
        </button>
        
        <button 
          onClick={clearLogs}
          className="btn btn-outline"
        >
          Limpar Logs
        </button>
      </div>

      {error && (
        <div className="error-box">
          <h3>❌ Erro Detectado:</h3>
          <p>{error}</p>
        </div>
      )}

      <div className="logs-section">
        <h3>📋 Logs de Execução:</h3>
        <div className="logs-container">
          {logs.length === 0 ? (
            <p className="no-logs">Nenhum log ainda. Clique em um dos botões de teste acima.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {farms.length > 0 && (
        <div className="results-section">
          <h3>✅ Fazendas Encontradas ({farms.length}):</h3>
          <div className="farms-grid">
            {farms.map((farm) => (
              <div key={farm.id} className="farm-card">
                <h4>{farm.name}</h4>
                <p><strong>ID:</strong> {farm.id}</p>
                <p><strong>Proprietário:</strong> {farm.ownerName}</p>
                <p><strong>Cidade:</strong> {farm.city}, {farm.state}</p>
                <p><strong>TOD:</strong> {farm.tod}</p>
                {farm.logoUrl && (
                  <img 
                    src={farm.logoUrl} 
                    alt={farm.name} 
                    className="farm-logo-small"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/img/default-capril.png';
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
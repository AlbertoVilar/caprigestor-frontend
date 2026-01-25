import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  getLactationHistory, 
  startLactation, 
  dryLactation, 
  getActiveLactation 
} from '../../api/GoatFarmAPI/lactation';
import type { LactationResponseDTO } from '../../Models/LactationDTOs';
import './LactationManager.css';

interface Props {
  farmId: number;
  goatId: number;
  goatName: string;
}

export default function LactationManager({ farmId, goatId, goatName }: Props) {
  const [activeLactation, setActiveLactation] = useState<LactationResponseDTO | null>(null);
  const [history, setHistory] = useState<LactationResponseDTO[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  
  const [showStartModal, setShowStartModal] = useState(false);
  const [showDryModal, setShowDryModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [dryDate, setDryDate] = useState('');

  // Carregar dados
  useEffect(() => {
    if (farmId && goatId) {
      loadData();
    }
  }, [farmId, goatId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const active = await getActiveLactation(farmId, goatId);
      setActiveLactation(active);
      
      const hist = await getLactationHistory(farmId, goatId);
      setHistory(hist.content || []);
    } catch (error) {
      console.error("Erro ao carregar lactação", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLactation = async () => {
    if (!startDate) return toast.warning("Informe a data de início");
    try {
      await startLactation(farmId, goatId, { startDate });
      toast.success("Lactação iniciada!");
      setShowStartModal(false);
      setStartDate('');
      loadData();
    } catch (e) {
      toast.error("Erro ao iniciar lactação");
    }
  };

  const handleDryLactation = async () => {
    if (!activeLactation) return;
    if (!dryDate) return toast.warning("Informe a data de secagem");
    try {
      await dryLactation(farmId, goatId, activeLactation.id, { endDate: dryDate });
      toast.success("Lactação encerrada (secagem realizada)!");
      setShowDryModal(false);
      setDryDate('');
      loadData();
    } catch (e) {
      toast.error("Erro ao realizar secagem");
    }
  };

  return (
    <div className="lactation-manager">
      <div className="lm-header">
         <h3>🥛 Controle de Lactação</h3>
         {!activeLactation && (
            <button className="btn-primary" onClick={() => setShowStartModal(true)}>
               <i className="fa-solid fa-play"></i> Iniciar Lactação
            </button>
         )}
      </div>

      {activeLactation && (
         <div className="active-lactation-card">
            <div>
              <h4>🟢 Lactação Ativa</h4>
              <p><strong>Início:</strong> {new Date(activeLactation.startDate).toLocaleDateString()}</p>
            </div>
            <button className="btn-warning" onClick={() => setShowDryModal(true)}>
               <i className="fa-solid fa-stop"></i> Realizar Secagem
            </button>
         </div>
      )}

      <div className="lactation-history">
         <h4>Histórico</h4>
         {history.length === 0 ? <p>Nenhum registro encontrado.</p> : (
            <table>
               <thead>
                  <tr>
                     <th>Início</th>
                     <th>Fim (Secagem)</th>
                     <th>Status</th>
                  </tr>
               </thead>
               <tbody>
                  {history.map(l => (
                     <tr key={l.id}>
                        <td>{new Date(l.startDate).toLocaleDateString()}</td>
                        <td>{l.endDate ? new Date(l.endDate).toLocaleDateString() : '-'}</td>
                        <td>
                          {l.isClosed ? (
                            <span style={{color: '#666'}}>Encerrada</span>
                          ) : (
                            <span style={{color: 'green', fontWeight: 'bold'}}>Ativa</span>
                          )}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         )}
      </div>

      {/* Modal Iniciar */}
      {showStartModal && (
         <div className="lm-modal-overlay">
            <div className="lm-modal-content">
               <h3>Nova Lactação</h3>
               <p>Animal: <strong>{goatName}</strong></p>
               <div className="lm-form-group">
                  <label>Data de Início (Parto/Início):</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
               </div>
               <div className="lm-modal-actions">
                  <button className="btn-secondary" onClick={() => setShowStartModal(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={handleStartLactation}>Salvar</button>
               </div>
            </div>
         </div>
      )}

      {/* Modal Secar */}
      {showDryModal && (
         <div className="lm-modal-overlay">
            <div className="lm-modal-content">
               <h3>Secar Cabra</h3>
               <p>Isso encerrará a lactação atual.</p>
               <div className="lm-form-group">
                  <label>Data de Secagem:</label>
                  <input type="date" value={dryDate} onChange={e => setDryDate(e.target.value)} />
               </div>
               <div className="lm-modal-actions">
                  <button className="btn-secondary" onClick={() => setShowDryModal(false)}>Cancelar</button>
                  <button className="btn-warning" onClick={handleDryLactation}>Confirmar Secagem</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

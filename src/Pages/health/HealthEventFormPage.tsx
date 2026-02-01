import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { fetchGoatByFarmAndRegistration } from "../../api/GoatAPI/goat";
import { HealthEventCreateDTO, HealthEventType, HealthEventStatus } from "../../Models/HealthDTOs";
import { GoatResponseDTO } from "../../Models/goatResponseDTO";
import "./healthPages.css";

const EVENT_TYPES = [
  { value: HealthEventType.VACCINE, label: "Vacinação" },
  { value: HealthEventType.EXAM, label: "Exame" },
  { value: HealthEventType.ILLNESS, label: "Doença" },
  { value: HealthEventType.TREATMENT, label: "Tratamento" },
  { value: HealthEventType.HOOF_TRIMMING, label: "Casqueamento" },
  { value: HealthEventType.DEWORMING, label: "Vermifugação" },
];

export default function HealthEventFormPage() {
  const { farmId, goatId, eventId } = useParams<{ farmId: string; goatId: string; eventId?: string }>();
  const navigate = useNavigate();
  const isEdit = !!eventId;
  
  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<HealthEventCreateDTO>({
    defaultValues: {
      status: HealthEventStatus.SCHEDULED,
      date: new Date().toISOString().split('T')[0]
    }
  });

  const selectedType = watch("eventType");

  useEffect(() => {
    async function loadData() {
      if (!farmId || !goatId) return;
  
      try {
        setLoading(true);
        const goatData = await fetchGoatByFarmAndRegistration(Number(farmId), goatId);
        setGoat(goatData);
  
        if (isEdit && eventId) {
          const eventData = await healthAPI.getById(Number(farmId), Number(eventId));
          
          if (eventData.status !== HealthEventStatus.SCHEDULED) {
            toast.warn("Eventos concluídos ou cancelados não podem ser editados.");
            navigate(-1);
            return;
          }
  
          // Preencher formulário
          Object.entries(eventData).forEach(([key, value]) => {
              if (key === 'date' && typeof value === 'string') {
                  setValue('date', value.split('T')[0]);
              } else {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  setValue(key as any, value);
              }
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [farmId, goatId, eventId, isEdit, navigate, setValue]);

  const onSubmit = async (data: HealthEventCreateDTO) => {
    if (!goat || !farmId) return;

    try {
      const payload = {
        ...data,
        goatId: goat.id,
      };

      if (isEdit && eventId) {
        await healthAPI.update(Number(farmId), Number(eventId), payload);
        toast.success("Evento atualizado com sucesso!");
      } else {
        await healthAPI.create(Number(farmId), payload);
        toast.success("Evento criado com sucesso!");
      }
      navigate(-1);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar evento.");
    }
  };

  if (loading) return <div className="page-loading">Carregando...</div>;

  return (
    <div className="health-page">
      <div className="health-header">
        <div className="health-header__content">
          <button className="btn-text mb-2" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i> Cancelar
          </button>
          <h2>{isEdit ? "Editar Evento" : "Novo Evento Sanitário"}</h2>
          <p>Animal: <strong>{goat?.name}</strong></p>
        </div>
      </div>

      <div className="module-hero" style={{ background: 'white' }}>
        <form onSubmit={handleSubmit(onSubmit)} className="row g-3">
          
          <div className="col-md-6">
            <label className="form-label">Tipo de Evento *</label>
            <select 
              className="form-select" 
              {...register("eventType", { required: "Tipo é obrigatório" })}
              disabled={isEdit} 
            >
              <option value="">Selecione...</option>
              {EVENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.eventType && <span className="text-danger small">{errors.eventType.message}</span>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Data *</label>
            <input 
              type="date" 
              className="form-control" 
              {...register("date", { required: "Data é obrigatória" })} 
            />
            {errors.date && <span className="text-danger small">{errors.date.message}</span>}
          </div>

          <div className="col-md-12">
            <label className="form-label">Descrição / Observações</label>
            <textarea 
              className="form-control" 
              rows={3} 
              {...register("description")} 
            />
          </div>

          {/* Campos Condicionais */}
          
          {selectedType === HealthEventType.VACCINE && (
            <>
              <div className="col-md-6">
                <label className="form-label">Nome da Vacina</label>
                <input type="text" className="form-control" {...register("vaccineName")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Lote</label>
                <input type="text" className="form-control" {...register("batchNumber")} />
              </div>
            </>
          )}

          {selectedType === HealthEventType.ILLNESS && (
            <div className="col-md-12">
              <label className="form-label">Nome da Doença / Diagnóstico</label>
              <input type="text" className="form-control" {...register("illnessName")} />
            </div>
          )}

          {(selectedType === HealthEventType.TREATMENT || selectedType === HealthEventType.ILLNESS) && (
            <div className="col-md-12">
              <label className="form-label">Detalhes do Tratamento</label>
              <textarea 
                className="form-control" 
                rows={2} 
                placeholder="Medicamentos, dosagem, duração..." 
                {...register("treatmentDetails")} 
              />
            </div>
          )}

          <div className="col-md-6">
            <label className="form-label">Responsável</label>
            <input type="text" className="form-control" {...register("performer")} placeholder="Nome do vet ou funcionário" />
          </div>

          <div className="col-md-6">
            <label className="form-label">Custo (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              className="form-control" 
              {...register("cost", { valueAsNumber: true })} 
            />
          </div>

          <div className="col-md-6">
             <label className="form-label">Status</label>
             <select className="form-select" {...register("status")}>
                <option value={HealthEventStatus.SCHEDULED}>Agendado</option>
                <option value={HealthEventStatus.COMPLETED}>Realizado</option>
                <option value={HealthEventStatus.CANCELLED}>Cancelado</option>
             </select>
          </div>

          <div className="col-12 mt-4 d-flex gap-2">
            <button type="submit" className="btn btn-primary">
              <i className="fa-solid fa-save"></i> Salvar
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

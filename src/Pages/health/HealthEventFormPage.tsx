import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { healthAPI } from "../../api/GoatFarmAPI/health";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { 
  HealthEventCreateRequestDTO, 
  HealthEventType, 
  HealthEventStatus,
  DoseUnit,
  AdministrationRoute 
} from "../../Models/HealthDTOs";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import { GoatResponseDTO } from "../../Models/goatResponseDTO";
import "./healthPages.css";

export default function HealthEventFormPage() {
  const { farmId, goatId, eventId } = useParams<{ farmId: string; goatId: string; eventId?: string }>();
  const navigate = useNavigate();
  const isEdit = !!eventId;
  
  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const EVENT_TYPES = [
    { value: HealthEventType.VACINA, label: "Vacinação" },
    { value: HealthEventType.VERMIFUGACAO, label: "Vermifugação" },
    { value: HealthEventType.MEDICACAO, label: "Medicação" },
    { value: HealthEventType.PROCEDIMENTO, label: "Procedimento" },
    { value: HealthEventType.DOENCA, label: "Doença/Ocorrência" },
  ];

  const DOSE_UNITS = [
    { value: DoseUnit.ML, label: "ml" },
    { value: DoseUnit.MG, label: "mg" },
    { value: DoseUnit.G, label: "g" },
    { value: DoseUnit.UI, label: "UI" },
    { value: DoseUnit.TABLET, label: "Comprimido" },
    { value: DoseUnit.FRASCO, label: "Frasco" },
    { value: DoseUnit.DOSE, label: "Dose" },
    { value: DoseUnit.OUTRO, label: "Outro" },
  ];

  const ROUTES = [
    { value: AdministrationRoute.IM, label: "Intramuscular (IM)" },
    { value: AdministrationRoute.SC, label: "Subcutânea (SC)" },
    { value: AdministrationRoute.IV, label: "Intravenosa (IV)" },
    { value: AdministrationRoute.VO, label: "Oral (VO)" },
    { value: AdministrationRoute.TOPICA, label: "Tópica/Pour-on" },
    { value: AdministrationRoute.INTRAMAMARIA, label: "Intramamária" },
    { value: AdministrationRoute.OUTRO, label: "Outro" },
  ];

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<HealthEventCreateRequestDTO>({
    defaultValues: {
      scheduledDate: new Date().toISOString().split('T')[0]
    }
  });

  const selectedType = watch("type");

  useEffect(() => {
    async function loadData() {
      if (!farmId || !goatId) return;
  
      try {
        setLoading(true);
        const goatData = await fetchGoatById(Number(farmId), goatId);
        setGoat(goatData);
  
        if (isEdit && eventId && goatData.id) {
          const eventData = await healthAPI.getById(Number(farmId), goatData.id.toString(), Number(eventId));
          
          if (eventData.status !== HealthEventStatus.AGENDADO) {
            toast.warn("Apenas eventos agendados podem ser editados.");
            // navigate(-1); // Optional: force exit
            // return;
          }
  
          // Populate form
          // We need to map the response DTO to the Create/Update Request DTO structure
          setValue('type', eventData.type);
          setValue('title', eventData.title);
          setValue('description', eventData.description);
          setValue('scheduledDate', eventData.scheduledDate.split('T')[0]);
          setValue('notes', eventData.notes);
          
          if (eventData.productName) setValue('productName', eventData.productName);
          if (eventData.activeIngredient) setValue('activeIngredient', eventData.activeIngredient);
          if (eventData.dose) setValue('dose', eventData.dose);
          if (eventData.doseUnit) setValue('doseUnit', eventData.doseUnit);
          if (eventData.route) setValue('route', eventData.route);
          if (eventData.batchNumber) setValue('batchNumber', eventData.batchNumber);
          if (eventData.withdrawalMilkDays) setValue('withdrawalMilkDays', eventData.withdrawalMilkDays);
          if (eventData.withdrawalMeatDays) setValue('withdrawalMeatDays', eventData.withdrawalMeatDays);
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

  const onSubmit = async (data: HealthEventCreateRequestDTO) => {
    if (!goat || !farmId) return;

    try {
      // Clean up empty strings to undefined or null if needed, but axios usually handles it.
      // Important: Ensure numbers are actually numbers
      const payload: HealthEventCreateRequestDTO = {
        ...data,
        dose: data.dose ? Number(data.dose) : undefined,
        withdrawalMilkDays: data.withdrawalMilkDays ? Number(data.withdrawalMilkDays) : undefined,
        withdrawalMeatDays: data.withdrawalMeatDays ? Number(data.withdrawalMeatDays) : undefined,
      };

      if (isEdit && eventId) {
        await healthAPI.update(Number(farmId), goatId, Number(eventId), payload);
        toast.success("Evento atualizado com sucesso!");
      } else {
        await healthAPI.create(Number(farmId), goatId, payload);
        toast.success("Evento criado com sucesso!");
      }
      navigate(-1);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      const parsed = parseApiError(error);
      const message = getApiErrorMessage(parsed);
      toast.error(`Erro ao salvar evento: ${message}`);
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Erros de validação do formulário:", errors);
    toast.error("Por favor, preencha todos os campos obrigatórios.");
  };

  if (loading) return <div className="page-loading">Carregando...</div>;

  const showMedicationFields = [
    HealthEventType.VACINA, 
    HealthEventType.MEDICACAO, 
    HealthEventType.VERMIFUGACAO
  ].includes(selectedType);

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
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="row g-3">
          
          <div className="col-md-6">
            <label className="form-label">Tipo de Evento *</label>
            <select 
              className="form-select" 
              {...register("type", { required: "Tipo é obrigatório" })}
              disabled={isEdit} 
            >
              <option value="">Selecione...</option>
              {EVENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.type && <span className="text-danger small">{errors.type.message}</span>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Data Agendada *</label>
            <input 
              type="date" 
              className="form-control" 
              {...register("scheduledDate", { required: "Data é obrigatória" })} 
            />
            {errors.scheduledDate && <span className="text-danger small">{errors.scheduledDate.message}</span>}
          </div>

          <div className="col-md-12">
            <label className="form-label">Título *</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ex: Vacina Aftosa, Tratamento Mastite..."
              {...register("title", { required: "Título é obrigatório" })} 
            />
            {errors.title && <span className="text-danger small">{errors.title.message}</span>}
          </div>

          <div className="col-md-12">
            <label className="form-label">Descrição</label>
            <textarea 
              className="form-control" 
              rows={2} 
              {...register("description")} 
            />
          </div>

          {/* Campos Condicionais para Medicamentos/Vacinas */}
          {showMedicationFields && (
            <>
              <div className="col-12"><hr className="my-2"/> <h6 className="text-muted">Detalhes do Produto</h6></div>
              
              <div className="col-md-6">
                <label className="form-label">Nome do Produto</label>
                <input type="text" className="form-control" {...register("productName")} />
              </div>

              <div className="col-md-6">
                <label className="form-label">Princípio Ativo</label>
                <input type="text" className="form-control" {...register("activeIngredient")} />
              </div>

              <div className="col-md-3">
                <label className="form-label">Dose</label>
                <input type="number" step="0.01" className="form-control" {...register("dose")} />
              </div>

              <div className="col-md-3">
                <label className="form-label">Unidade</label>
                <select className="form-select" {...register("doseUnit")}>
                  <option value="">Selecione...</option>
                  {DOSE_UNITS.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Via de Administração</label>
                <select className="form-select" {...register("route")}>
                  <option value="">Selecione...</option>
                  {ROUTES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Lote</label>
                <input type="text" className="form-control" {...register("batchNumber")} />
              </div>

              <div className="col-md-3">
                <label className="form-label">Carência Leite (dias)</label>
                <input type="number" className="form-control" {...register("withdrawalMilkDays")} />
              </div>

              <div className="col-md-3">
                <label className="form-label">Carência Carne (dias)</label>
                <input type="number" className="form-control" {...register("withdrawalMeatDays")} />
              </div>
            </>
          )}

          <div className="col-md-12 mt-3">
            <label className="form-label">Observações Adicionais</label>
            <textarea 
              className="form-control" 
              rows={2} 
              {...register("notes")} 
            />
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

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
import { getTodayLocalDate, toLocalDateInputValue } from "../../utils/localDate";

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
    shouldUnregister: false,
    defaultValues: {
      scheduledDate: getTodayLocalDate()
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
  
        if (isEdit && eventId) {
          // Use goatId from URL params for consistency with other calls
          const eventData = await healthAPI.getById(Number(farmId), goatId, Number(eventId));
          
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
          setValue('scheduledDate', toLocalDateInputValue(eventData.scheduledDate));
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
      // Sanitização rigorosa do payload
      console.log("Raw form data:", data);

      const isMedicationType = [
        HealthEventType.VACINA, 
        HealthEventType.MEDICACAO, 
        HealthEventType.VERMIFUGACAO
      ].includes(data.type);
      
      const payload: HealthEventCreateRequestDTO = {
        type: data.type,
        title: data.title,
        scheduledDate: data.scheduledDate, 
        description: data.description || undefined,
        notes: data.notes || undefined,
        
        // Apenas envia dados de medicamento se for do tipo apropriado
        productName: isMedicationType ? (data.productName || undefined) : undefined,
        activeIngredient: isMedicationType ? (data.activeIngredient || undefined) : undefined,
        batchNumber: isMedicationType ? (data.batchNumber || undefined) : undefined,
        
        dose: isMedicationType && (data.dose !== undefined && data.dose !== null && String(data.dose) !== '') 
            ? Number(data.dose) 
            : undefined,
            
        doseUnit: isMedicationType ? (data.doseUnit || undefined) : undefined,
        route: isMedicationType ? (data.route || undefined) : undefined,
        
        withdrawalMilkDays: isMedicationType && (data.withdrawalMilkDays !== undefined && data.withdrawalMilkDays !== null && String(data.withdrawalMilkDays) !== '') 
            ? Math.floor(Number(data.withdrawalMilkDays)) 
            : undefined,
            
        withdrawalMeatDays: isMedicationType && (data.withdrawalMeatDays !== undefined && data.withdrawalMeatDays !== null && String(data.withdrawalMeatDays) !== '')
            ? Math.floor(Number(data.withdrawalMeatDays)) 
            : undefined,
      };

      console.log("Payload sanitizado para envio:", payload);

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

  const handleInvalid = (e: React.FormEvent) => {
    e.preventDefault();
    console.warn("Formulário inválido (evento nativo)", e);
  };

  if (loading) return <div className="page-loading">Carregando...</div>;

  const showMedicationFields = [
    HealthEventType.VACINA, 
    HealthEventType.MEDICACAO, 
    HealthEventType.VERMIFUGACAO
  ].includes(selectedType);

  return (
    <div className="health-page">
      <div className="health-hero">
        <div className="health-hero__meta">
          <button className="health-btn health-btn-text mb-2" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i> Cancelar
          </button>
          <h1>{isEdit ? "Editar Evento" : "Novo Evento Sanitário"}</h1>
          <p className="health-hero__animal">Animal: <strong>{goat?.name}</strong></p>
        </div>
      </div>

      <div className="health-content-card">
        <form 
          onSubmit={handleSubmit(onSubmit, onInvalid)} 
          onInvalid={handleInvalid}
          className="row g-3"
        >
          
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
            <button type="submit" className="health-btn health-btn-primary">
              <i className="fa-solid fa-save"></i> Salvar
            </button>
            <button type="button" className="health-btn health-btn-outline-secondary" onClick={() => navigate(-1)}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

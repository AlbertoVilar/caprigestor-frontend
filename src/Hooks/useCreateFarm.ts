// 🎣 Hook personalizado para criação de fazenda

import { useState, useCallback } from 'react';
import { FarmFormState, PhoneFormData, ValidationResult, GoatFarmFullResponse } from '../types/farmTypes';
import { FarmValidator } from '../utils/FarmValidator';
import { FarmDataConverter } from '../utils/FarmDataConverter';
import { FarmService } from '../services/FarmService';

/**
 * Estados possíveis do formulário
 */
type FormStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Interface do hook useCreateFarm
 */
interface UseCreateFarmReturn {
  // Estado do formulário
  formData: FarmFormState;
  status: FormStatus;
  errors: Record<string, string>;
  response: GoatFarmFullResponse | null;
  
  // Ações de atualização
  updateField: (field: keyof FarmFormState, value: string) => void;
  updateFormData: (data: Partial<FarmFormState>) => void;
  
  // Gerenciamento de telefones
  addPhone: () => void;
  removePhone: (phoneId: string) => void;
  updatePhone: (phoneId: string, field: keyof PhoneFormData, value: string) => void;
  
  // Validação
  validateForm: () => ValidationResult;
  clearErrors: () => void;
  
  // Submissão
  submitForm: () => Promise<boolean>;
  
  // Reset
  resetForm: () => void;
  
  // Estados computados
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  hasErrors: boolean;
}

/**
 * Estado inicial do formulário
 */
const initialFormState: FarmFormState = {
  // Dados do capril
  farmName: '',
  farmTod: '',
  
  // Dados do usuário
  userName: '',
  userEmail: '',
  userCpf: '',
  userPassword: '',
  userConfirmPassword: '',
  userRoles: '',
  
  // Endereço
  addressStreet: '',
  addressComplement: '',
  addressNeighborhood: '',
  addressCity: '',
  addressState: '',
  addressPostalCode: '',
  addressCountry: 'Brasil',
  
  // Telefones
  phones: [FarmDataConverter.createEmptyPhone()]
};

/**
 * Hook personalizado para gerenciar o formulário de criação de fazenda
 */
export const useCreateFarm = (): UseCreateFarmReturn => {
  // Estados
  const [formData, setFormData] = useState<FarmFormState>(initialFormState);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<GoatFarmFullResponse | null>(null);
  
  // Atualiza um campo específico do formulário
  const updateField = useCallback((field: keyof FarmFormState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Remove erro do campo se existir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);
  
  // Atualiza múltiplos campos do formulário
  const updateFormData = useCallback((data: Partial<FarmFormState>) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  }, []);
  
  // Adiciona um novo telefone
  const addPhone = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      phones: [...prev.phones, FarmDataConverter.createEmptyPhone()]
    }));
  }, []);
  
  // Remove um telefone
  const removePhone = useCallback((phoneId: string) => {
    setFormData(prev => ({
      ...prev,
      phones: prev.phones.filter(phone => phone.id !== phoneId)
    }));
    
    // Remove erros relacionados ao telefone removido
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.includes(phoneId)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  }, []);
  
  // Atualiza um campo específico de um telefone
  const updatePhone = useCallback((phoneId: string, field: keyof PhoneFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      phones: prev.phones.map(phone => 
        phone.id === phoneId 
          ? { ...phone, [field]: value }
          : phone
      )
    }));
    
    // Remove erro do campo se existir
    const errorKey = `phone_${phoneId}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [errors]);
  
  // Valida o formulário
  const validateForm = useCallback((): ValidationResult => {
    const validationResult = FarmValidator.validateAll(formData);
    setErrors(validationResult.errors);
    return validationResult;
  }, [formData]);
  
  // Limpa todos os erros
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);
  
  // Submete o formulário
  const submitForm = useCallback(async (): Promise<boolean> => {
    try {
      setStatus('loading');
      setErrors({});
      
      console.log('🔍 Validando formulário...');
      
      // Validar dados
      const validationResult = validateForm();
      if (!validationResult.isValid) {
        console.log('❌ Formulário inválido:', validationResult.errors);
        setStatus('error');
        return false;
      }
      
      console.log('✅ Formulário válido, convertendo dados...');
      
      // Converter dados para formato da API
      const apiData = FarmDataConverter.formToApiRequest(formData);
      
      console.log('📤 Enviando dados para API:', apiData);
      
      // Enviar para API
      const result = await FarmService.createFullFarm(apiData);
      
      console.log('🎉 Fazenda criada com sucesso:', result);
      
      setResponse(result);
      setStatus('success');
      
      return true;
    } catch (error) {
      console.error('💥 Erro ao criar fazenda:', error);
      
      setStatus('error');
      
      // Tratar diferentes tipos de erro
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'Erro desconhecido ao criar fazenda' });
      }
      
      return false;
    }
  }, [formData, validateForm]);
  
  // Reseta o formulário
  const resetForm = useCallback(() => {
    setFormData(initialFormState);
    setStatus('idle');
    setErrors({});
    setResponse(null);
  }, []);
  
  // Estados computados
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const hasErrors = Object.keys(errors).length > 0;
  
  return {
    // Estado
    formData,
    status,
    errors,
    response,
    
    // Ações
    updateField,
    updateFormData,
    addPhone,
    removePhone,
    updatePhone,
    validateForm,
    clearErrors,
    submitForm,
    resetForm,
    
    // Estados computados
    isLoading,
    isSuccess,
    isError,
    hasErrors
  };
};

export default useCreateFarm;
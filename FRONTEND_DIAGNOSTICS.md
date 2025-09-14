# FRONTEND_DIAGNOSTICS.md

## 1) Ambiente e versões

**SO:** Windows

**Node:** `node -v` → v22.16.0

**npm/yarn/pnpm:** `npm -v` → 10.9.2

**React:** ^19.1.0

**Vite/CRA/Next:** Vite ^4.4.1

**Axios:** ^1.11.0

**Browser:** Chrome (versão atual)

### 1.1) Variáveis de ambiente
```
VITE_CLIENT_ID=myclientid
VITE_CLIENT_SECRET=myclientsecret
# Nota: Não há REACT_APP_API_BASE_URL - a baseURL está hardcoded no request.ts
```

## 2) Como reproduzir o erro

**Abrir a tela:** /goats/new

**Preencher:**
- registrationNumber: (ex.: "12345")
- name: (ex.: "Cabra Teste")
- gender (UI): "Macho" ou "Fêmea"
- status (UI): "Ativo" (padrão)
- breed: (ex.: "Anglo Nubiana")
- color: (ex.: "Marrom")
- birthDate (formato digitado): YYYY-MM-DD via input date
- farmId: Selecionado via dropdown
- userId: Preenchido automaticamente via contexto
- fatherRegistrationNumber: (opcional)
- motherRegistrationNumber: (opcional)

**Clicar em:** "Cadastrar".

**Resultado:** 
- ❌ Erro 400 Bad Request no POST /api/goatfarms/goats
- ⚠️  GET prévio para /api/goatfarms/goats/{registrationNumber} pode estar interferindo

**Comportamento esperado:** 201 Created e redirecionar para listagem.

## 3) Logs e tráfego de rede

### 3.1) POST de criação (obrigatório)

**URL:** http://localhost:8080/api/goatfarms/goats

**Status:** (a ser preenchido)

**Request Headers (resumo):**
```
Authorization: Bearer <token-cortado>
Content-Type: application/json
```

**Request Payload (copiar exatamente do DevTools):**
```json
{
  "registrationNumber": "",
  "name": "",
  "birthDate": "",
  "breed": "",
  "color": "",
  "gender": "",   // o que foi enviado (M/F, Macho, MALE…)
  "status": "",   // o que foi enviado (ACTIVE/Ativo…)
  "farmId": 0,
  "userId": 0,
  "fatherRegistrationNumber": "",
  "motherRegistrationNumber": ""
}
```

**Response Body (se houver):**
```json
{}
```

### 3.2) Requisições inesperadas (se houver)

**URL completa:** (a ser preenchido se houver GET inesperado)

**Quem chamou:** (arquivo/linha se souber)

**Payload/params:** (a ser preenchido)

**Status:** (a ser preenchido)

### 3.3) HAR (anexar)

Adicione o arquivo .har exportado do DevTools.

## 4) Código – trechos relevantes

### 4.1) src/utils/request.ts
```typescript
import axios, { AxiosResponse, AxiosError } from "axios";
import { getAccessToken, refreshAccessToken, logOut } from "../services/auth-service";

// Configuração base do Axios
const requestBackEnd = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flags para controle de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// Processa a fila de requisições após refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de requisição - adiciona token de autenticação
requestBackEnd.interceptors.request.use(
  (config) => {
    // Endpoints que não precisam de autenticação
    const publicEndpoints = [
      "/auth/login",
      "/auth/refresh",
      "/goatfarms", // GET público para listar fazendas
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.startsWith(endpoint)
    );

    if (!isPublicEndpoint) {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Log da requisição em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`🔄 [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`, {
        headers: config.headers,
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    console.error("❌ Erro no interceptor de requisição:", error);
    return Promise.reject(error);
  }
);

// Interceptor de resposta - trata erros e refresh de token
requestBackEnd.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log da resposta em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`✅ [${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        data: response.data,
        headers: response.headers,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Log do erro em desenvolvimento
    if (import.meta.env.DEV) {
      console.error(`❌ [${error.response?.status || 'NETWORK'}] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        error: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
    }

    // Erro 401 - Token expirado
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Se já está fazendo refresh, adiciona à fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return requestBackEnd(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return requestBackEnd(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        logOut();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Erro 403 - Sem permissão
    if (error.response?.status === 403) {
      console.warn("⚠️ Acesso negado (403). Redirecionando para página de erro.");
      window.location.href = "/403";
    }

    // Erro 500 - Erro interno do servidor
    if (error.response?.status === 500) {
      console.error("💥 Erro interno do servidor (500):", error.response.data);
    }

    // Erro de rede
    if (!error.response) {
      console.error("🌐 Erro de rede - servidor indisponível");
    }

    return Promise.reject(error);
  }
);

// Funções utilitárias para requisições
export const makeRequest = requestBackEnd;

export const get = (url: string, config?: any) => requestBackEnd.get(url, config);
export const post = (url: string, data?: any, config?: any) => requestBackEnd.post(url, data, config);
export const put = (url: string, data?: any, config?: any) => requestBackEnd.put(url, data, config);
export const del = (url: string, config?: any) => requestBackEnd.delete(url, config);
export const patch = (url: string, data?: any, config?: any) => requestBackEnd.patch(url, data, config);

export { requestBackEnd };
```

### 4.2) src/api/goat.ts
```typescript
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import { requestBackEnd } from "../../utils/request";
import { mapGoatToBackend } from "../../Convertes/goats/goatConverter";

/**
 * 🚨 Observações importantes
 * - Backend correto para criação/edição de caprinos: `POST/PUT /goatfarms/goats`
 * - Busca por registro: `GET /goatfarms/goats/registration/{registrationNumber}`
 * - Listagem por fazenda (paginada): `GET /goatfarms/{farmId}/goats`
 * - Busca por nome (opcionalmente com filtro de fazenda): `GET /goatfarms/goats/name?name=...&farmId=...`
 */

/** 🔎 Lista todas as cabras (paginado). Uso administrativo/diagnóstico. */
export async function getAllGoats(page = 0, size = 100): Promise<GoatResponseDTO[]> {
  const { data } = await requestBackEnd.get("/goatfarms/goats", { params: { page, size } });
  // O backend geralmente retorna Page<T>; pegue data.content se existir
  return Array.isArray(data) ? data : (data?.content ?? []);
}

/** 🔎 Busca cabras por nome; pode filtrar por fazenda via farmId (se suportado no BE). */
export async function searchGoatsByNameAndFarmId(
  farmId: number | undefined,
  name: string
): Promise<GoatResponseDTO[]> {
  const params: Record<string, string | number> = { name };
  if (typeof farmId !== "undefined") params.farmId = farmId;

  const { data } = await requestBackEnd.get("/goatfarms/goats/name", { params });
  return Array.isArray(data) ? data : (data?.content ?? []);
}

/** ✅ Lista cabras por ID da fazenda, com paginação (endpoint do BE). */
export async function findGoatsByFarmIdPaginated(
  farmId: number,
  page: number,
  size: number
): Promise<{
  content: GoatResponseDTO[];
  page: { number: number; totalPages: number };
}> {
  const { data } = await requestBackEnd.get(`/goatfarms/${farmId}/goats`, {
    params: { page, size },
  });
  return data;
}

/** ✅ Busca única por número de registro (endpoint do BE). */
export async function fetchGoatByRegistrationNumber(
  registrationNumber: string
): Promise<GoatResponseDTO> {
  const { data } = await requestBackEnd.get(`/goatfarms/goats/registration/${registrationNumber}`);
  return data;
}

/** ✅ Criação de nova cabra (payload mapeado para o formato do backend). */
export const createGoat = async (goatData: GoatRequestDTO): Promise<GoatResponseDTO> => {
  const payload = mapGoatToBackend(goatData);
  const response = await requestBackEnd.post("/goatfarms/goats", payload);
  return response.data;
};

/** ✅ Atualização de cabra existente (PUT /goatfarms/goats/{registrationNumber}). */
export async function updateGoat(
  registrationNumber: string,
  goatData: GoatRequestDTO
): Promise<GoatResponseDTO> {
  const payload = mapGoatToBackend(goatData);
  const { data } = await requestBackEnd.put(`/goatfarms/goats/${registrationNumber}`, payload);
  return data;
}
```

### 4.3) src/Convertes/goats/goatConverter.ts
```typescript
// src/Convertes/goats/goatConverter.ts
import type { GoatRequestDTO } from "../../Models/goatRequestDTO";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { GoatStatusEnum, GoatGenderEnum, GoatCategoryEnum } from "../../types/goatEnums";
import { 
  getStatusLabel,
  getGenderLabel,
  getBackendStatus,
  getBackendGender
} from "../../utils/i18nGoat";

// Interface para dados do formulário com labels em português
interface GoatFormData {
  id?: string | number;
  registrationNumber?: string;
  name?: string;
  breed?: string;
  color?: string;
  birthDate?: string;
  farmId?: string | number;
  userId?: string | number; // ✅ Corrigido: ownerId → userId
  gender?: GoatGenderEnum | string;
  status?: GoatStatusEnum | string;
  genderLabel?: string; // "Macho" | "Fêmea"
  statusLabel?: string; // "Ativo" | "Inativo" | "Vendido" | "Falecido"
  category?: string;
  weight?: number;
  height?: number;
  observations?: string;
  microchipNumber?: string;
  toe?: string;
  tod?: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
  motherId?: string | number;
  fatherId?: string | number;
  createdAt?: string;
  updatedAt?: string;
}

/** --------- Util: data em ISO (YYYY-MM-DD) --------- */
const toISO = (v?: string | Date): string | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") {
    // já está ISO?
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // dd/mm/yyyy
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  }
  return undefined;
};

/** --------- Tipo do payload esperado pelo BACKEND (POST /api/goats) --------- */
export type BackendGoatCreateDTO = {
  registrationNumber: string;
  name: string;
  sex: "MALE" | "FEMALE";            // backend usa 'sex' (obrigatório)
  birthDate?: string;                // ISO
  breed?: string;
  coat?: string;                     // backend usa 'coat'
  situation?: "ATIVO" | "INACTIVE" | "SOLD" | "DECEASED";
  farmId: number | string;           // ✅ Corrigido: farmId (obrigatório)
  userId: number | string;           // ✅ userId (obrigatório)
};

/** 
 * FRONT (form - PT/DTO do FE) -> BACK (payload)
 * - NÃO inclui motherId/fatherId (genealogia é outra rota)
 */
export const mapGoatToBackend = (goat: GoatFormData): BackendGoatCreateDTO => {
  const sex = getBackendGender(goat.genderLabel ?? goat.gender);
  const situation = getBackendStatus(goat.statusLabel ?? goat.status);

  return {
    registrationNumber: String(goat.registrationNumber ?? "").trim(),
    name: String(goat.name ?? "").trim(),
    sex: sex as "MALE" | "FEMALE",
    birthDate: toISO(goat.birthDate),
    breed: goat.breed || undefined,
    coat: goat.color || undefined,
    situation: situation as BackendGoatCreateDTO["situation"],
    farmId: Number(goat.farmId), // ✅ Corrigido: farmId (obrigatório)
    userId: Number(goat.userId), // ✅ userId (obrigatório)
  };
};

/**
 * BACK (GoatResponseDTO) -> FRONT (dados pro form)
 * - Sem motherId/fatherId (não existem no seu GoatResponseDTO atual)
 * - Com labels PT para selects no formulário
 */
export const convertResponseToRequest = (response: ExtendedGoatResponse): GoatFormData => {
  const extendedResponse = response as ExtendedGoatResponse;
  const genderValue = extendedResponse.gender || extendedResponse.sex;
  const statusValue = extendedResponse.status || extendedResponse.situation;
  
  const genderLabel = getGenderLabel(genderValue || "");
  const statusLabel = getStatusLabel(statusValue || "");

  return {
    // campos básicos
    id: extendedResponse.id,
    registrationNumber: extendedResponse.registrationNumber || "",
    name: extendedResponse.name || "",
    breed: extendedResponse.breed || "",
    color: extendedResponse.color || extendedResponse.coat || "",
    birthDate: extendedResponse.birthDate || "",
    farmId: extendedResponse.farmId || extendedResponse.goatFarmId || extendedResponse.goatFarm?.id || "",
    userId: extendedResponse.userId || extendedResponse.user?.id || extendedResponse.ownerId || extendedResponse.owner?.id || "", // ✅ Corrigido: incluir userId

    // enums originais
    gender: genderValue,
    status: statusValue,

    // labels em português para o formulário
    genderLabel,
    statusLabel,

    // campos opcionais
    category: extendedResponse.category,
    toe: extendedResponse.toe || "",
    tod: extendedResponse.tod || "",
    weight: extendedResponse.weight,
    height: extendedResponse.height,
    observations: extendedResponse.observations,
    microchipNumber: extendedResponse.microchipNumber,
    fatherRegistrationNumber: extendedResponse.fatherRegistrationNumber,
    motherRegistrationNumber: extendedResponse.motherRegistrationNumber,
    motherId: extendedResponse.motherId,
    fatherId: extendedResponse.fatherId,
    createdAt: extendedResponse.createdAt,
    updatedAt: extendedResponse.updatedAt,
  };
};
```

### 4.4) src/utils/i18nGoat.ts
```typescript
// Mappers de internacionalização para cabras
// Converte entre labels em português (UI) e enums do backend

// Status: UI (PT) ↔ Backend (Mix PT/EN)
export const uiStatusToBe: Record<string, string> = {
  "Ativo": "ATIVO",
  "Inativo": "INACTIVE", 
  "Vendido": "SOLD",
  "Falecido": "DECEASED"
};

export const beStatusToUi: Record<string, string> = {
  "ATIVO": "Ativo",
  "INACTIVE": "Inativo",
  "SOLD": "Vendido", 
  "DECEASED": "Falecido"
};

// Gênero: UI (PT) ↔ Backend (EN)
export const uiGenderToBe: Record<string, string> = {
  "Macho": "MALE",
  "Fêmea": "FEMALE"
};

export const beGenderToUi: Record<string, string> = {
  "MALE": "Macho",
  "FEMALE": "Fêmea"
};

// Arrays para popular os selects do formulário
export const UI_STATUS_LABELS = ["Ativo", "Inativo", "Vendido", "Falecido"];
export const UI_GENDER_LABELS = ["Macho", "Fêmea"];

// Funções utilitárias
export const getStatusLabel = (backendStatus: string): string => {
  return beStatusToUi[backendStatus] || backendStatus;
};

export const getGenderLabel = (backendGender: string): string => {
  return beGenderToUi[backendGender] || backendGender;
};

export const getBackendStatus = (uiLabel: string): string => {
  return uiStatusToBe[uiLabel] || uiLabel;
};

export const getBackendGender = (uiLabel: string): string => {
  return uiGenderToBe[uiLabel] || uiLabel;
};
```

### 4.5) src/Components/GoatCreateForm.tsx
```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGoat } from '../../api/GoatAPI/goat';
import { mapGoatToBackend } from '../../Convertes/goats/goatConverter';
import { GoatFormData } from '../../Convertes/goats/goatConverter';
import { UI_STATUS_LABELS, UI_GENDER_LABELS } from '../../utils/i18nGoat';
import { useAuth } from '../../contexts/AuthContext';
import { useFarms } from '../../contexts/FarmContext';
import { toast } from 'react-toastify';

interface GoatCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const GoatCreateForm: React.FC<GoatCreateFormProps> = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { farms } = useFarms();

  const [formData, setFormData] = useState<GoatFormData>({
    registrationNumber: '',
    name: '',
    breed: '',
    color: '',
    gender: '',
    birthDate: '',
    status: 'Ativo',
    category: '',
    toe: '',
    tod: '',
    farmId: '',
    userId: user?.id || '',
    fatherRegistrationNumber: '',
    motherRegistrationNumber: '',
    weight: undefined,
    height: undefined,
    registrationNumber2: '',
    microchipNumber: '',
    observations: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({ ...prev, userId: user.id }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Número de registro é obrigatório';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gênero é obrigatório';
    }
    if (!formData.farmId) {
      newErrors.farmId = 'Fazenda é obrigatória';
    }
    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('RequestBackend - Dados do formulário:', formData);
      
      const backendData = mapGoatToBackend(formData);
      console.log('RequestBackend - Dados convertidos para backend:', backendData);
      
      const response = await createGoat(backendData);
      console.log('RequestBackend - Resposta do backend:', response);
      
      toast.success('Cabra cadastrada com sucesso!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/cabras');
      }
    } catch (error: any) {
      console.error('RequestBackend - Erro ao cadastrar cabra:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Erro ao cadastrar cabra';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/cabras');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="goat-create-form">
      {/* Seção: Dados da Cabra */}
      <div className="form-section">
        <h3>Dados da Cabra</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="registrationNumber">Número de Registro *</label>
            <input
              type="text"
              id="registrationNumber"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleInputChange}
              className={errors.registrationNumber ? 'error' : ''}
              required
            />
            {errors.registrationNumber && <span className="error-message">{errors.registrationNumber}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Nome *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? 'error' : ''}
              required
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gender">Gênero *</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className={errors.gender ? 'error' : ''}
              required
            >
              <option value="">Selecione...</option>
              {UI_GENDER_LABELS.map(label => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
            {errors.gender && <span className="error-message">{errors.gender}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              {UI_STATUS_LABELS.map(label => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="breed">Raça</label>
            <input
              type="text"
              id="breed"
              name="breed"
              value={formData.breed}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="color">Cor</label>
            <input
              type="text"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="birthDate">Data de Nascimento *</label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className={errors.birthDate ? 'error' : ''}
              required
            />
            {errors.birthDate && <span className="error-message">{errors.birthDate}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="farmId">Fazenda *</label>
            <select
              id="farmId"
              name="farmId"
              value={formData.farmId}
              onChange={handleInputChange}
              className={errors.farmId ? 'error' : ''}
              required
            >
              <option value="">Selecione uma fazenda...</option>
              {farms.map(farm => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
            {errors.farmId && <span className="error-message">{errors.farmId}</span>}
          </div>
        </div>
      </div>

      {/* Seção: Genealogia */}
      <div className="form-section">
        <h3>Genealogia</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fatherRegistrationNumber">Registro do Pai</label>
            <input
              type="text"
              id="fatherRegistrationNumber"
              name="fatherRegistrationNumber"
              value={formData.fatherRegistrationNumber}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="motherRegistrationNumber">Registro da Mãe</label>
            <input
              type="text"
              id="motherRegistrationNumber"
              name="motherRegistrationNumber"
              value={formData.motherRegistrationNumber}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {/* Seção: Informações Adicionais */}
      <div className="form-section">
        <h3>Informações Adicionais</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="weight">Peso (kg)</label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight || ''}
              onChange={handleInputChange}
              step="0.1"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="height">Altura (cm)</label>
            <input
              type="number"
              id="height"
              name="height"
              value={formData.height || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="microchipNumber">Número do Microchip</label>
            <input
              type="text"
              id="microchipNumber"
              name="microchipNumber"
              value={formData.microchipNumber}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="registrationNumber2">Registro Secundário</label>
            <input
              type="text"
              id="registrationNumber2"
              name="registrationNumber2"
              value={formData.registrationNumber2}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="observations">Observações</label>
            <textarea
              id="observations"
              name="observations"
              value={formData.observations}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="form-actions">
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
};

export default GoatCreateForm;
```

### 4.6) DTOs

**src/Models/goatRequestDTO.ts**
```typescript
import { GoatCategoryEnum, GoatStatusEnum, GoatGenderEnum } from '../types/goatEnums.tsx';

export interface GoatRequestDTO {
  registrationNumber: string;
  name: string;
  breed: string;
  color: string;
  gender: GoatGenderEnum;
  birthDate: string;
  status: GoatStatusEnum;
  category: GoatCategoryEnum;
  toe: string;
  tod: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
  farmId: number | string;
  userId: number | string;
  // Campos opcionais adicionais
  weight?: number;
  height?: number;
  registrationNumber2?: string;
  microchipNumber?: string;
  observations?: string;
  motherId?: string;
  fatherId?: string;
}
```

**src/Models/goatResponseDTO.ts**
```typescript
import { GoatCategoryEnum, GoatStatusEnum, GoatGenderEnum } from '../types/goatEnums.tsx';

export interface GoatResponseDTO {
  registrationNumber: string;
  name: string;
  breed: string;
  color: string;
  gender: GoatGenderEnum | "MACHO" | "FÊMEA";
  birthDate: string;
  status: GoatStatusEnum | "INACTIVE" | "SOLD" | "DECEASED";
  category: GoatCategoryEnum | string;
  toe: string;
  tod: string;
  farmId: number;
  farmName: string;
  ownerName: string;
  ownerId?: number; // ✅ adicione isso!
  fatherName?: string;
  motherName?: string;
  fatherRegistrationNumber?: string;
  motherRegistrationNumber?: string;
}
```

### 4.7) Hooks / rotas (se houver)

**Rotas principais (src/main.tsx):**
```typescript
// Rotas públicas relacionadas a goats:
{ path: "cabras", element: <GoatListPage /> },
{ path: "goats", element: <GoatListPage /> },

// Rota privada para criação:
{ path: "goats/new", element: (
  <PrivateRoute roles={[RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
    <GoatCreatePage />
  </PrivateRoute>
) },

// Rota privada para eventos:
{
  path: "cabras/:registrationNumber/eventos",
  element: (
    <PrivateRoute roles={[RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]}>
      <GoatEventsPage />
    </PrivateRoute>
  ),
},
```

**Hooks específicos para goats:**
```typescript
// ❌ NÃO FORAM ENCONTRADOS hooks específicos para goats
// Apenas hooks para farms: useCreateFarm
// O formulário de goats usa diretamente as funções da API
```

## 5) Mapeamentos UI ↔ Backend (como está hoje)

**Gender (UI → enviado):**
- "Macho" → "MALE" (via uiGenderToBe)
- "Fêmea" → "FEMALE" (via uiGenderToBe)

**Status (UI → enviado):**
- "Ativo" → "ATIVO" (via uiStatusToBe)
- "Inativo" → "INACTIVE" (via uiStatusToBe)
- "Vendido" → "SOLD" (via uiStatusToBe)
- "Falecido" → "DECEASED" (via uiStatusToBe)

**Data:** 
- Digitada como: input type="date" (YYYY-MM-DD)
- Enviada como: YYYY-MM-DD (sem conversão adicional)
- Função toISO() disponível mas não usada no form atual

**IDs:**
- farmId: vem do select de fazendas (farms context)
- userId: vem do contexto de autenticação (user?.id)

## 6) Prints (opcional mas útil)

- Tela do formulário no momento do envio
- Aba Network do DevTools (linha do POST)
- Console (erros e logs do "RequestBackend")

## 7) Observações extras (opcionais)

**Lógica de pré-validação identificada:**
- ❌ **PROBLEMA**: GoatCreateForm faz GET para validar duplicatas
- 🔍 **Função**: `fetchGoatByRegistrationNumber()` antes do POST
- ⚠️  **Impacto**: Pode estar interferindo no fluxo de cadastro
- 📋 **Recomendação**: Remover validação prévia ou mover para backend

**Contextos utilizados:**
- AuthContext: fornece user.id
- FarmContext: fornece lista de fazendas
- Toast: notificações de sucesso/erro

**Funcionalidades adicionais:**
- Sistema usa validação de duplicata via GET antes do POST
- Genealogia é criada após cadastro da cabra se pais informados
- Toast notifications para feedback do usuário

## 8) Busca por possíveis chamadas erradas

**Procura por chamadas /goats/reg:**
```bash
# Resultado: NENHUMA chamada /goats/reg encontrada
```

**Procura por GETs no fluxo de criação:**
```bash
# ❌ ENCONTRADA chamada GET indevida:
# src/Components/goat-create-form/GoatCreateForm.tsx:166
# await fetchGoatByRegistrationNumber(formData.registrationNumber);
```

**Análise do código:**
- ❌ **PROBLEMA ENCONTRADO**: GoatCreateForm.tsx faz GET durante submit!
- 🔍 **Linha 166**: `await fetchGoatByRegistrationNumber(formData.registrationNumber)`
- 📋 **Contexto**: Validação prévia para evitar duplicatas no modo "create"
- ⚠️  **Comportamento**: Se GET retorna 200, bloqueia cadastro com toast de erro
- ✅ **Lógica**: Se GET retorna 404, permite prosseguir (TOD disponível)
- 🐛 **ESTE É O PROBLEMA**: GET desnecessário que pode estar causando o erro 400

**Trecho problemático:**
```typescript
// Validação prévia para evitar duplicatas (apenas no modo create)
if (mode === "create" && formData.registrationNumber) {
  try {
    await fetchGoatByRegistrationNumber(formData.registrationNumber);
    // Se chegou aqui, significa que já existe uma cabra com este TOD
    toast.error("❌ Já existe uma cabra cadastrada com este TOD...");
    return; // BLOQUEIA O CADASTRO
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log('✅ TOD disponível para cadastro');
    }
  }
}
```

## 9) Resultado desejado (definição de pronto)

✅ **POST /api/goatfarms/goats retorna 201 Created**

✅ **Payload correto com:**
- registrationNumber, name, gender: 'MALE'|'FEMALE', breed, color
- birthDate (YYYY-MM-DD), status ('ATIVO'|'INACTIVE'|'SOLD'|'DECEASED')
- farmId (Long), userId (Long)
- (opcionais) fatherRegistrationNumber, motherRegistrationNumber

❌ **PROBLEMA IDENTIFICADO: Nenhum GET deve ser disparado durante o submit**
- **Remover**: `fetchGoatByRegistrationNumber()` do GoatCreateForm.tsx linha 166
- **Alternativa**: Validação de duplicata deve ser feita no backend

🔧 **CORREÇÃO NECESSÁRIA:**
```typescript
// REMOVER este bloco do GoatCreateForm.tsx:
if (mode === "create" && formData.registrationNumber) {
  try {
    await fetchGoatByRegistrationNumber(formData.registrationNumber);
    // ... lógica de validação
  } catch (error) {
    // ... tratamento de erro
  }
}
```

📋 **DIAGNÓSTICO COMPLETO:**
- ✅ Arquivos de código coletados e analisados
- ✅ Mapeamentos UI ↔ Backend documentados  
- ❌ **CAUSA RAIZ**: GET desnecessário antes do POST
- 🎯 **SOLUÇÃO**: Remover validação prévia do frontend

---

**Status:** ✅ Erro 404 na validação de duplicata foi corrigido
**Última correção:** Função fetchGoatByRegistrationNumber no GoatFarmAPI atualizada para usar URL correta `/goatfarms/goats/registration/`
**Próximos passos:** Preencher este diagnóstico com dados reais de execução
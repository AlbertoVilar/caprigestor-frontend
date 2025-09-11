# Exemplos Práticos de Implementação Frontend

## 1. EXEMPLOS DE COMPONENTES REACT

### 1.1 Componente de Login

```jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Senha:</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
};

export default LoginForm;
```

### 1.2 Componente de Cadastro de Cabra

```jsx
import React, { useState } from 'react';
import { useGoats } from '../contexts/GoatsContext';
import { toast } from 'react-toastify';

const GoatForm = ({ goat = null, onClose }) => {
  const [formData, setFormData] = useState({
    registrationNumber: goat?.registrationNumber || '',
    name: goat?.name || '',
    gender: goat?.gender || 'FEMALE',
    breed: goat?.breed || 'MESTIÇA',
    color: goat?.color || '',
    birthDate: goat?.birthDate || '',
    status: goat?.status || 'ACTIVE',
    tod: goat?.tod || '',
    toe: goat?.toe || '',
    category: goat?.category || 'CRIA',
    weight: goat?.weight || '',
    observations: goat?.observations || ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { createGoat, updateGoat } = useGoats();

  const breeds = [
    'ALPINE', 'ANGLO_NUBIANA', 'BOER', 'MESTIÇA', 
    'MURCIANA_GRANADINA', 'ALPINA', 'SAANEN', 'TOGGENBURG'
  ];
  
  const genders = ['MALE', 'FEMALE'];
  const statuses = ['ACTIVE', 'INACTIVE', 'SOLD', 'DECEASED'];
  const categories = ['REPRODUTOR', 'MATRIZ', 'CRIA', 'RECRIA', 'DESCARTE'];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.registrationNumber || formData.registrationNumber.length < 10 || formData.registrationNumber.length > 12) {
      newErrors.registrationNumber = 'Número de registro deve ter entre 10 e 12 caracteres';
    }
    
    if (!formData.name || formData.name.length < 3 || formData.name.length > 60) {
      newErrors.name = 'Nome deve ter entre 3 e 60 caracteres';
    }
    
    if (!formData.tod || formData.tod.length !== 5) {
      newErrors.tod = 'TOD deve ter exatamente 5 caracteres';
    }
    
    if (!formData.toe || formData.toe.length < 5 || formData.toe.length > 7) {
      newErrors.toe = 'TOE deve ter entre 5 e 7 caracteres';
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (goat) {
        await updateGoat(goat.registrationNumber, formData);
        toast.success('Cabra atualizada com sucesso!');
      } else {
        await createGoat(formData);
        toast.success('Cabra cadastrada com sucesso!');
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar cabra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="goat-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="registrationNumber">Número de Registro *</label>
          <input
            type="text"
            id="registrationNumber"
            value={formData.registrationNumber}
            onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
            className={errors.registrationNumber ? 'error' : ''}
            disabled={!!goat} // Não permite editar se for atualização
          />
          {errors.registrationNumber && <span className="error-message">{errors.registrationNumber}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Nome *</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="gender">Sexo *</label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => setFormData({...formData, gender: e.target.value})}
          >
            {genders.map(gender => (
              <option key={gender} value={gender}>
                {gender === 'MALE' ? 'Macho' : 'Fêmea'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="breed">Raça *</label>
          <select
            id="breed"
            value={formData.breed}
            onChange={(e) => setFormData({...formData, breed: e.target.value})}
          >
            {breeds.map(breed => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="tod">TOD *</label>
          <input
            type="text"
            id="tod"
            value={formData.tod}
            onChange={(e) => setFormData({...formData, tod: e.target.value})}
            className={errors.tod ? 'error' : ''}
            maxLength={5}
          />
          {errors.tod && <span className="error-message">{errors.tod}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="toe">TOE *</label>
          <input
            type="text"
            id="toe"
            value={formData.toe}
            onChange={(e) => setFormData({...formData, toe: e.target.value})}
            className={errors.toe ? 'error' : ''}
            maxLength={7}
          />
          {errors.toe && <span className="error-message">{errors.toe}</span>}
        </div>
      </div>
      
      <div className="form-actions">
        <button type="button" onClick={onClose} disabled={loading}>
          Cancelar
        </button>
        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : (goat ? 'Atualizar' : 'Cadastrar')}
        </button>
      </div>
    </form>
  );
};

export default GoatForm;
```

### 1.3 Context de Autenticação

```jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthService } from '../services/AuthService';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.accessToken,
        refreshToken: action.payload.refreshToken
      };
    case 'LOGIN_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null
      };
    case 'REFRESH_TOKEN':
      return {
        ...state,
        token: action.payload.accessToken,
        refreshToken: action.payload.refreshToken
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: false,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authService = new AuthService();

  useEffect(() => {
    // Verificar se há token válido no localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Verificar se o token ainda é válido
      authService.validateToken(token)
        .then(user => {
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken: token } });
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        });
    }
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await authService.login(email, password);
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
      
      return response;
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken(state.refreshToken);
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      dispatch({ type: 'REFRESH_TOKEN', payload: response });
      
      return response;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value = {
    ...state,
    login,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
```

## 2. SERVIÇOS DE API

### 2.1 Serviço Base de API

```javascript
class ApiService {
  constructor(baseURL = 'http://localhost:8080/api') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('accessToken');
  }

  setAuthToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default ApiService;
```

### 2.2 Serviço de Cabras

```javascript
import ApiService from './ApiService';

class GoatService extends ApiService {
  async getGoats(params = {}) {
    return this.get('/goats', params);
  }

  async getGoat(registrationNumber) {
    return this.get(`/goats/${registrationNumber}`);
  }

  async createGoat(goatData) {
    // Adicionar userId do usuário logado
    const userData = JSON.parse(localStorage.getItem('user'));
    const payload = {
      ...goatData,
      userId: userData.id
    };
    
    return this.post('/goats', payload);
  }

  async updateGoat(registrationNumber, goatData) {
    return this.put(`/goats/${registrationNumber}`, goatData);
  }

  async deleteGoat(registrationNumber) {
    return this.delete(`/goats/${registrationNumber}`);
  }

  async getGoatEvents(registrationNumber, params = {}) {
    return this.get(`/goats/${registrationNumber}/events`, params);
  }

  async createGoatEvent(registrationNumber, eventData) {
    return this.post(`/goats/${registrationNumber}/events`, eventData);
  }

  async updateGoatEvent(registrationNumber, eventId, eventData) {
    return this.put(`/goats/${registrationNumber}/events/${eventId}`, eventData);
  }
}

export default GoatService;
```

## 3. HOOKS CUSTOMIZADOS

### 3.1 Hook para Paginação

```javascript
import { useState, useEffect } from 'react';

export const usePagination = (fetchFunction, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });
  const [params, setParams] = useState(initialParams);

  const fetchData = async (newParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchFunction({
        ...params,
        ...newParams,
        page: newParams.page || pagination.page,
        size: newParams.size || pagination.size
      });
      
      setData(response.content || response.data || response);
      setPagination({
        page: response.number || 0,
        size: response.size || 10,
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const changePage = (newPage) => {
    fetchData({ page: newPage });
  };

  const changeSize = (newSize) => {
    fetchData({ page: 0, size: newSize });
  };

  const updateParams = (newParams) => {
    setParams({ ...params, ...newParams });
    fetchData({ ...newParams, page: 0 });
  };

  const refresh = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    pagination,
    changePage,
    changeSize,
    updateParams,
    refresh
  };
};
```

### 3.2 Hook para Formulários

```javascript
import { useState } from 'react';

export const useForm = (initialValues, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const setTouched = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validate = () => {
    const newErrors = {};
    
    Object.keys(validationRules).forEach(field => {
      const rules = validationRules[field];
      const value = values[field];
      
      if (rules.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = rules.required;
      } else if (rules.minLength && value && value.length < rules.minLength.value) {
        newErrors[field] = rules.minLength.message;
      } else if (rules.maxLength && value && value.length > rules.maxLength.value) {
        newErrors[field] = rules.maxLength.message;
      } else if (rules.pattern && value && !rules.pattern.value.test(value)) {
        newErrors[field] = rules.pattern.message;
      } else if (rules.custom && value) {
        const customError = rules.custom(value, values);
        if (customError) {
          newErrors[field] = customError;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};
```

## 4. COMPONENTES DE UI

### 4.1 Componente de Tabela

```jsx
import React from 'react';

const DataTable = ({ 
  data, 
  columns, 
  loading, 
  pagination, 
  onPageChange, 
  onSizeChange,
  actions 
}) => {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="skeleton-table">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-row">
              {columns.map((_, j) => (
                <div key={j} className="skeleton-cell"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} className={column.className}>
                {column.title}
              </th>
            ))}
            {actions && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map(column => (
                <td key={column.key} className={column.className}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              {actions && (
                <td className="actions">
                  {actions.map(action => (
                    <button
                      key={action.key}
                      className={`btn btn-${action.type}`}
                      onClick={() => action.onClick(row)}
                      title={action.title}
                    >
                      {action.icon}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {pagination && (
        <div className="table-pagination">
          <div className="pagination-info">
            Mostrando {pagination.page * pagination.size + 1} a {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} de {pagination.totalElements} registros
          </div>
          
          <div className="pagination-controls">
            <select 
              value={pagination.size} 
              onChange={(e) => onSizeChange(parseInt(e.target.value))}
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
            
            <div className="page-buttons">
              <button 
                disabled={pagination.page === 0}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                Anterior
              </button>
              
              <span>Página {pagination.page + 1} de {pagination.totalPages}</span>
              
              <button 
                disabled={pagination.page >= pagination.totalPages - 1}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
```

### 4.2 Componente de Modal

```jsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal modal-${size}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
```

## 5. ESTILOS CSS (EXEMPLO COM TAILWIND)

### 5.1 Estilos para Formulários

```css
.form-group {
  @apply mb-4;
}

.form-group label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-group input,
.form-group select,
.form-group textarea {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
  @apply border-red-500 focus:ring-red-500;
}

.error-message {
  @apply text-red-500 text-sm mt-1;
}

.form-row {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-actions {
  @apply flex justify-end space-x-2 mt-6;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.btn-secondary {
  @apply bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-gray-500;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}
```

### 5.2 Estilos para Tabelas

```css
.data-table {
  @apply bg-white shadow-sm rounded-lg overflow-hidden;
}

.data-table table {
  @apply w-full;
}

.data-table th {
  @apply px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}

.data-table td {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200;
}

.data-table .actions {
  @apply text-right;
}

.data-table .actions button {
  @apply ml-2 p-1 rounded hover:bg-gray-100;
}

.table-pagination {
  @apply px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center;
}

.pagination-info {
  @apply text-sm text-gray-700;
}

.pagination-controls {
  @apply flex items-center space-x-4;
}

.page-buttons {
  @apply flex items-center space-x-2;
}

.page-buttons button {
  @apply px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}
```

## 6. CONFIGURAÇÃO DE ROTEAMENTO

### 6.1 Rotas Protegidas

```jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !user.roles.includes(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### 6.2 Configuração de Rotas

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GoatsPage from './pages/GoatsPage';
import EventsPage from './pages/EventsPage';
import GenealogyPage from './pages/GenealogyPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rotas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/goats" element={
            <ProtectedRoute>
              <GoatsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/events" element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/genealogy" element={
            <ProtectedRoute>
              <GenealogyPage />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          
          {/* Rota para admins */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <AdminPage />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

Esses exemplos fornecem uma base sólida para implementar o frontend do sistema GoatFarm, seguindo as melhores práticas de desenvolvimento React e integrando perfeitamente com a API backend existente.
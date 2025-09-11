# Exemplos React + TypeScript - Sistema GoatFarm

## 📋 Índice
1. [Configuração Inicial](#configuração-inicial)
2. [Context API para Estado Global](#context-api-para-estado-global)
3. [Hooks Customizados](#hooks-customizados)
4. [Componentes de Formulário](#componentes-de-formulário)
5. [Componentes de Lista](#componentes-de-lista)
6. [Roteamento e Guards](#roteamento-e-guards)
7. [Componentes de UI](#componentes-de-ui)

---

## 🚀 Configuração Inicial

### package.json
```json
{
  "name": "goatfarm-frontend",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^4.9.0",
    "axios": "^1.3.0",
    "react-hook-form": "^7.43.0",
    "react-query": "^3.39.0",
    "date-fns": "^2.29.0",
    "lucide-react": "^0.263.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 🌐 Context API para Estado Global

### AuthContext
```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService } from '@/services/AuthService';
import { UserResponse, LoginRequest } from '@/types/auth';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authService = new AuthService();

  const isAuthenticated = !!user;

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userResponse = await authService.getCurrentUser();
        setUser(userResponse);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### ApiContext
```typescript
// src/contexts/ApiContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { ApiService } from '@/services/ApiService';
import { AuthService } from '@/services/AuthService';
import { FarmService } from '@/services/FarmService';
import { GoatService } from '@/services/GoatService';
import { EventService } from '@/services/EventService';

interface ApiContextType {
  farmService: FarmService;
  goatService: GoatService;
  eventService: EventService;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

interface ApiProviderProps {
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const authService = new AuthService();
  const apiService = new ApiService(authService);
  
  const farmService = new FarmService(apiService);
  const goatService = new GoatService(apiService);
  const eventService = new EventService(apiService);

  const value: ApiContextType = {
    farmService,
    goatService,
    eventService,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};
```

---

## 🎣 Hooks Customizados

### useFarms
```typescript
// src/hooks/useFarms.ts
import { useState, useEffect } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { GoatFarmFullResponse, PageResponse } from '@/types/farm';

interface UseFarmsOptions {
  page?: number;
  size?: number;
  searchQuery?: string;
  autoLoad?: boolean;
}

export const useFarms = (options: UseFarmsOptions = {}) => {
  const { page = 0, size = 20, searchQuery = '', autoLoad = true } = options;
  const { farmService } = useApi();
  
  const [farms, setFarms] = useState<GoatFarmFullResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
  });

  const loadFarms = async (pageNum = page, searchTerm = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      
      let response: PageResponse<GoatFarmFullResponse>;
      
      if (searchTerm.trim()) {
        response = await farmService.searchFarms(searchTerm, pageNum, size);
      } else {
        response = await farmService.getFarms(pageNum, size);
      }
      
      setFarms(response.content);
      setPagination({
        currentPage: response.number,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fazendas');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadFarms(pagination.currentPage, searchQuery);

  useEffect(() => {
    if (autoLoad) {
      loadFarms();
    }
  }, [page, searchQuery, autoLoad]);

  return {
    farms,
    loading,
    error,
    pagination,
    loadFarms,
    refresh,
  };
};
```

### usePermissions
```typescript
// src/hooks/usePermissions.ts
import { useAuth } from '@/contexts/AuthContext';
import { GoatFarmResponse, GoatResponse } from '@/types';

export const usePermissions = () => {
  const { user } = useAuth();

  const isAdmin = () => {
    return user?.roles.includes('ROLE_ADMIN') || false;
  };

  const isFarmOwner = () => {
    return user?.roles.includes('ROLE_FARM_OWNER') || false;
  };

  const canEditFarm = (farm: GoatFarmResponse) => {
    if (!user) return false;
    if (isAdmin()) return true;
    if (isFarmOwner()) return farm.userId === user.id;
    return false;
  };

  const canEditGoat = (goat: GoatResponse) => {
    return canEditFarm(goat.farm);
  };

  const canAccessAdmin = () => {
    return isAdmin();
  };

  return {
    isAdmin,
    isFarmOwner,
    canEditFarm,
    canEditGoat,
    canAccessAdmin,
  };
};
```

---

## 📝 Componentes de Formulário

### LoginForm
```typescript
// src/components/forms/LoginForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { LoginRequest } from '@/types/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      await login(data);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          {...register('email', {
            required: 'Email é obrigatório',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido',
            },
          })}
          type="email"
          placeholder="Email"
          error={errors.email?.message}
        />
      </div>
      
      <div>
        <Input
          {...register('password', {
            required: 'Senha é obrigatória',
            minLength: {
              value: 6,
              message: 'Senha deve ter pelo menos 6 caracteres',
            },
          })}
          type="password"
          placeholder="Senha"
          error={errors.password?.message}
        />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Button type="submit" loading={loading} className="w-full">
        Entrar
      </Button>
    </form>
  );
};
```

### GoatForm
```typescript
// src/components/forms/GoatForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '@/contexts/ApiContext';
import { GoatRequest, GoatResponse, GoatGender } from '@/types/goat';
import { GoatFarmResponse } from '@/types/farm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';

interface GoatFormProps {
  goat?: GoatResponse;
  farmId?: number;
  onSuccess?: (goat: GoatResponse) => void;
  onCancel?: () => void;
}

export const GoatForm: React.FC<GoatFormProps> = ({
  goat,
  farmId,
  onSuccess,
  onCancel,
}) => {
  const { goatService, farmService } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farms, setFarms] = useState<GoatFarmResponse[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GoatRequest>({
    defaultValues: goat ? {
      registrationNumber: goat.registrationNumber,
      name: goat.name,
      breed: goat.breed || '',
      gender: goat.gender,
      birthDate: goat.birthDate || '',
      weight: goat.weight || 0,
      color: goat.color || '',
      observations: goat.observations || '',
      farmId: goat.farm.id,
      fatherId: goat.father?.registrationNumber || '',
      motherId: goat.mother?.registrationNumber || '',
    } : {
      farmId: farmId || 0,
      gender: GoatGender.FEMALE,
    },
  });

  const selectedFarmId = watch('farmId');

  useEffect(() => {
    const loadFarms = async () => {
      try {
        const response = await farmService.getFarms(0, 100);
        setFarms(response.content.map(f => f.farm));
      } catch (err) {
        console.error('Erro ao carregar fazendas:', err);
      }
    };
    loadFarms();
  }, []);

  const onSubmit = async (data: GoatRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      let result: GoatResponse;
      if (goat) {
        result = await goatService.updateGoat(goat.registrationNumber, data);
      } else {
        result = await goatService.createGoat(data);
      }
      
      onSuccess?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar caprino');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          {...register('registrationNumber', {
            required: 'Número de registro é obrigatório',
          })}
          placeholder="Número de Registro"
          error={errors.registrationNumber?.message}
          disabled={!!goat} // Não permite editar se for atualização
        />
        
        <Input
          {...register('name', {
            required: 'Nome é obrigatório',
          })}
          placeholder="Nome"
          error={errors.name?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          {...register('farmId', {
            required: 'Fazenda é obrigatória',
            valueAsNumber: true,
          })}
          error={errors.farmId?.message}
        >
          <option value="">Selecione uma fazenda</option>
          {farms.map(farm => (
            <option key={farm.id} value={farm.id}>
              {farm.name}
            </option>
          ))}
        </Select>
        
        <Select
          {...register('gender', {
            required: 'Gênero é obrigatório',
          })}
          error={errors.gender?.message}
        >
          <option value={GoatGender.FEMALE}>Fêmea</option>
          <option value={GoatGender.MALE}>Macho</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          {...register('breed')}
          placeholder="Raça"
        />
        
        <Input
          {...register('birthDate')}
          type="date"
          placeholder="Data de Nascimento"
        />
        
        <Input
          {...register('weight', { valueAsNumber: true })}
          type="number"
          step="0.1"
          placeholder="Peso (kg)"
        />
      </div>

      <Input
        {...register('color')}
        placeholder="Cor"
      />

      <TextArea
        {...register('observations')}
        placeholder="Observações"
        rows={3}
      />

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={loading}>
          {goat ? 'Atualizar' : 'Criar'} Caprino
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
};
```

---

## 📋 Componentes de Lista

### FarmList
```typescript
// src/components/lists/FarmList.tsx
import React, { useState } from 'react';
import { useFarms } from '@/hooks/useFarms';
import { usePermissions } from '@/hooks/usePermissions';
import { GoatFarmFullResponse } from '@/types/farm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MapPin, Phone, Edit, Trash2 } from 'lucide-react';

interface FarmListProps {
  onEdit?: (farm: GoatFarmFullResponse) => void;
  onDelete?: (farm: GoatFarmFullResponse) => void;
  onView?: (farm: GoatFarmFullResponse) => void;
}

export const FarmList: React.FC<FarmListProps> = ({
  onEdit,
  onDelete,
  onView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const { canEditFarm } = usePermissions();
  
  const { farms, loading, error, pagination, loadFarms } = useFarms({
    page: currentPage,
    searchQuery,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-8">
        Erro ao carregar fazendas: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Buscar fazendas..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {farms.map((farmData) => (
          <FarmCard
            key={farmData.farm.id}
            farmData={farmData}
            canEdit={canEditFarm(farmData.farm)}
            onEdit={() => onEdit?.(farmData)}
            onDelete={() => onDelete?.(farmData)}
            onView={() => onView?.(farmData)}
          />
        ))}
      </div>

      {farms.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? 'Nenhuma fazenda encontrada' : 'Nenhuma fazenda cadastrada'}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

interface FarmCardProps {
  farmData: GoatFarmFullResponse;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

const FarmCard: React.FC<FarmCardProps> = ({
  farmData,
  canEdit,
  onEdit,
  onDelete,
  onView,
}) => {
  const { farm, address, phones } = farmData;

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
      <div onClick={onView}>
        <h3 className="font-semibold text-lg mb-2">{farm.name}</h3>
        
        {farm.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {farm.description}
          </p>
        )}

        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>
              {address.city}, {address.state}
            </span>
          </div>
          
          {phones.length > 0 && (
            <div className="flex items-center gap-2">
              <Phone size={16} />
              <span>{phones[0].number}</span>
            </div>
          )}
          
          {farm.totalArea && (
            <div className="text-xs">
              Área: {farm.totalArea} hectares
            </div>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="flex gap-2 mt-4 pt-3 border-t">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit size={16} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )}
    </Card>
  );
};
```

---

## 🛡️ Roteamento e Guards

### ProtectedRoute
```typescript
// src/components/guards/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireFarmOwner?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireFarmOwner = false,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdmin, isFarmOwner } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireFarmOwner && !isFarmOwner() && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

### AppRouter
```typescript
// src/components/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FarmsPage } from '@/pages/FarmsPage';
import { GoatsPage } from '@/pages/GoatsPage';
import { AdminPage } from '@/pages/AdminPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Rotas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="farms" element={<FarmsPage />} />
          <Route path="goats" element={<GoatsPage />} />
          
          {/* Rotas administrativas */}
          <Route path="admin" element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
```

---

## 🎨 Componentes de UI

### Button
```typescript
// src/components/ui/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
};
```

### Input
```typescript
// src/components/ui/Input.tsx
import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>((
  { error, label, className = '', ...props },
  ref
) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
```

### Modal
```typescript
// src/components/ui/Modal.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`
          relative bg-white rounded-lg shadow-xl w-full
          ${sizeClasses[size]}
        `}>
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🏗️ App Principal

```typescript
// src/App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ApiProvider } from '@/contexts/ApiContext';
import { AppRouter } from '@/components/router/AppRouter';
import { Toaster } from '@/components/ui/Toaster';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApiProvider>
          <AppRouter />
          <Toaster />
        </ApiProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

---

**Este conjunto de exemplos fornece uma base sólida para implementar o frontend React + TypeScript integrado com o backend GoatFarm. Adapte os estilos e estruturas conforme suas necessidades específicas.**
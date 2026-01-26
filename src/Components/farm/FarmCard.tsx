import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../Hooks/usePermissions';
import { PermissionButton } from '../rbac/PermissionButton';
import { PermissionWrapper } from '../rbac/PermissionWrapper';
import { RoleEnum } from '../../Models/auth';
import { deleteGoatFarm } from '../../api/GoatFarmAPI/goatFarm';
import { toast } from 'react-toastify';

export interface Farm {
  id: string;
  name: string;
  description?: string;
  location?: string;
  ownerId: number;
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
  goatCount?: number;
  isActive?: boolean;
}

export interface FarmCardProps {
  /** Dados da fazenda */
  farm: Farm;
  /** Callback para editar fazenda */
  onEdit?: (farm: Farm) => void;
  /** Callback para deletar fazenda */
  onDelete?: (farmId: string) => void;
  /** Callback para visualizar detalhes */
  onView?: (farm: Farm) => void;
  /** Callback para gerenciar cabras */
  onManageGoats?: (farm: Farm) => void;
  /** Callback para ver relatórios */
  onViewReports?: (farm: Farm) => void;
  /** Classe CSS customizada */
  className?: string;
  /** Se true, mostra ações em modo compacto */
  compact?: boolean;
  /** Se true, mostra informações do proprietário */
  showOwner?: boolean;
}

/**
 * Componente de card para fazenda com ações baseadas em permissões e ownership
 */
export const FarmCard: React.FC<FarmCardProps> = ({
  farm,
  onEdit,
  onDelete,
  onView,
  onManageGoats,
  onViewReports,
  className = '',
  compact = false,
  showOwner = true
}) => {
  const { tokenPayload } = useAuth();
  const permissions = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = tokenPayload?.userId === farm.ownerId;
  const isAdmin = permissions.isAdmin();
  const isOperator = permissions.isOperator();
  
  // Operator pode gerenciar se for dono da fazenda
  const canManage = isAdmin || (isOperator && isOwner);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar a fazenda "${farm.name}"? Esta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      // Converte o ID de string para número
      const farmIdNum = parseInt(farm.id);
      
      if (isNaN(farmIdNum)) {
        throw new Error('ID da fazenda inválido');
      }

      await deleteGoatFarm(farmIdNum);
      
      toast.success('Fazenda removida com sucesso!');
      
      // Se houver callback customizado, chama ele
      if (onDelete) {
        onDelete(farm.id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = error.response?.status;
      
      if (status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
      } else if (status === 403) {
        toast.error('Você não tem permissão para deletar esta fazenda.');
      } else if (status === 404) {
        toast.info('Fazenda não encontrada. A lista será atualizada.');
        if (onDelete) {
          onDelete(farm.id);
        }
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
        toast.error(`Erro ao deletar fazenda: ${errorMessage}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className={`farm-card ${className} ${!farm.isActive ? 'inactive' : ''}`}>
      {/* Header do Card */}
      <div className="farm-card-header">
        <div className="farm-info">
          <h3 className="farm-name">{farm.name}</h3>
          {farm.location && (
            <p className="farm-location">
              <span className="location-icon">📍</span>
              {farm.location}
            </p>
          )}
        </div>
        
        {/* Status Badge */}
        <div className="farm-status">
          <span className={`status-badge ${farm.isActive ? 'active' : 'inactive'}`}>
            {farm.isActive ? 'Ativa' : 'Inativa'}
          </span>
          {isOwner && (
            <span className="owner-badge">Proprietário</span>
          )}
        </div>
      </div>

      {/* Conteúdo do Card */}
      {!compact && (
        <div className="farm-card-content">
          {farm.description && (
            <p className="farm-description">{farm.description}</p>
          )}
          
          <div className="farm-stats">
            {typeof farm.goatCount === 'number' && (
              <div className="stat-item">
                <span className="stat-icon">🐐</span>
                <span className="stat-value">{farm.goatCount}</span>
                <span className="stat-label">Cabras</span>
              </div>
            )}
            
            {showOwner && farm.ownerName && (
              <div className="stat-item">
                <span className="stat-icon">👤</span>
                <span className="stat-value">{farm.ownerName}</span>
                <span className="stat-label">Proprietário</span>
              </div>
            )}
            
            <div className="stat-item">
              <span className="stat-icon">📅</span>
              <span className="stat-value">{formatDate(farm.createdAt)}</span>
              <span className="stat-label">Criada em</span>
            </div>
          </div>
        </div>
      )}

      {/* Ações do Card */}
      <div className="farm-card-actions">
        {/* Ação de Visualizar - Sempre disponível para usuários autenticados */}
        <PermissionButton
          onClick={() => onView?.(farm)}
          requireAuth={true}
          variant="secondary"
          size="sm"
          className="action-btn view-btn"
        >
          👁️ Ver Detalhes
        </PermissionButton>

        {/* Ação de Gerenciar Cabras - Para proprietários e admins */}
        <PermissionWrapper
          requireAuth={true}
          customCheck={() => canManage}
        >
          <button
            onClick={() => onManageGoats?.(farm)}
            className="action-btn manage-btn"
            disabled={!farm.isActive}
          >
            🐐 Gerenciar Cabras
          </button>
        </PermissionWrapper>

        {/* Ação de Editar - Para proprietários e admins */}
        <PermissionButton
          onClick={() => onEdit?.(farm)}
          requireAuth={true}
          customCheck={() => canManage}
          variant="primary"
          size="sm"
          className="action-btn edit-btn"
        >
          ✏️ Editar
        </PermissionButton>

        {/* Ação de Relatórios - Para proprietários e admins */}
        <PermissionWrapper
          requireAuth={true}
          customCheck={() => canManage}
        >
          <button
            onClick={() => onViewReports?.(farm)}
            className="action-btn reports-btn"
          >
            📊 Relatórios
          </button>
        </PermissionWrapper>

        {/* Ação de Deletar - Apenas para proprietários ou admins */}
        <PermissionButton
          onClick={handleDelete}
          requireAuth={true}
          customCheck={() => canManage}
          variant="danger"
          size="sm"
          className="action-btn delete-btn"
          disabled={isDeleting}
          confirmMessage={`Deletar fazenda "${farm.name}"?`}
        >
          {isDeleting ? '⏳ Deletando...' : '🗑️ Deletar'}
        </PermissionButton>
      </div>

      {/* Informações Adicionais para Admins */}
      <PermissionWrapper requiredRoles={[RoleEnum.ROLE_ADMIN]}>
        <div className="farm-admin-info">
          <small className="admin-details">
            ID: {farm.id} | Proprietário ID: {farm.ownerId}
            {farm.updatedAt && (
              <> | Atualizada: {formatDate(farm.updatedAt)}</>
            )}
          </small>
        </div>
      </PermissionWrapper>
    </div>
  );
};

/**
 * Props para lista de fazendas
 */
export interface FarmListProps {
  /** Lista de fazendas */
  farms: Farm[];
  /** Se true, mostra em modo compacto */
  compact?: boolean;
  /** Callbacks para ações */
  onEdit?: (farm: Farm) => void;
  onDelete?: (farmId: string) => void;
  onView?: (farm: Farm) => void;
  onManageGoats?: (farm: Farm) => void;
  onViewReports?: (farm: Farm) => void;
  /** Classe CSS customizada */
  className?: string;
  /** Mensagem quando não há fazendas */
  emptyMessage?: string;
}

/**
 * Componente de lista de fazendas
 */
export const FarmList: React.FC<FarmListProps> = ({
  farms,
  compact = false,
  onEdit,
  onDelete,
  onView,
  onManageGoats,
  onViewReports,
  className = '',
  emptyMessage = 'Nenhuma fazenda encontrada.'
}) => {
  if (farms.length === 0) {
    return (
      <div className={`farm-list-empty ${className}`}>
        <p>{emptyMessage}</p>
        <PermissionButton
          permission="canCreateFarm"
          onClick={() => window.location.href = '/registro'}
          variant="primary"
        >
          ➕ Criar Primeira Fazenda
        </PermissionButton>
      </div>
    );
  }

  return (
    <div className={`farm-list ${compact ? 'compact' : ''} ${className}`}>
      {farms.map(farm => (
        <FarmCard
          key={farm.id}
          farm={farm}
          compact={compact}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onManageGoats={onManageGoats}
          onViewReports={onViewReports}
        />
      ))}
    </div>
  );
};

export default FarmCard;

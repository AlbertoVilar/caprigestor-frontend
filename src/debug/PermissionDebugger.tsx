import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../Hooks/usePermissions";
import { RoleEnum } from "../Models/auth";
import { hasRole, hasAnyRoles } from "../services/auth-service";

interface Props {
  resourceOwnerId?: number;
}

export default function PermissionDebugger({ resourceOwnerId }: Props) {
  const { tokenPayload, isAuthenticated } = useAuth();
  const { canManage, canView, canCreate, canDelete, isAdmin, isOwner } = usePermissions({ resourceOwnerId });

  if (!isAuthenticated) {
    return (
      <div style={{ 
        position: "fixed", 
        bottom: "10px", 
        right: "10px", 
        background: "#ffebee", 
        padding: "10px", 
        border: "1px solid #f44336",
        fontSize: "12px",
        maxWidth: "300px",
        zIndex: 9999
      }}>
        <h4>Permission Debug - Não autenticado</h4>
      </div>
    );
  }

  const hasAdminRole = hasRole(RoleEnum.ROLE_ADMIN);
  const hasOperatorRole = hasRole(RoleEnum.ROLE_OPERATOR);
  const hasAnyRequiredRoles = hasAnyRoles([RoleEnum.ROLE_OPERATOR, RoleEnum.ROLE_ADMIN]);

  return (
    <div style={{ 
      position: "fixed", 
      bottom: "10px", 
      right: "10px", 
      background: "#e8f5e8", 
      padding: "10px", 
      border: "1px solid #4caf50",
      fontSize: "12px",
      maxWidth: "350px",
      zIndex: 9999,
      maxHeight: "400px",
      overflowY: "auto"
    }}>
      <h4>Permission Debug</h4>
      
      <div style={{ marginBottom: "10px" }}>
        <strong>Token Info:</strong><br/>
        User: {tokenPayload?.user_name}<br/>
        UserId: {tokenPayload?.userId}<br/>
        Authorities: {tokenPayload?.authorities?.join(", ")}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Role Checks:</strong><br/>
        Has ROLE_ADMIN: {hasAdminRole ? "✅" : "❌"}<br/>
        Has ROLE_OPERATOR: {hasOperatorRole ? "✅" : "❌"}<br/>
        Has Any Required: {hasAnyRequiredRoles ? "✅" : "❌"}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Resource Info:</strong><br/>
        ResourceOwnerId: {resourceOwnerId || "undefined"}<br/>
        Current UserId: {tokenPayload?.userId}
      </div>

      <div style={{ marginBottom: "10px" }}>
        <strong>Permission Results:</strong><br/>
        isAdmin: {isAdmin ? "✅" : "❌"}<br/>
        isOwner: {isOwner ? "✅" : "❌"}<br/>
        canView: {canView ? "✅" : "❌"}<br/>
        canManage: {canManage ? "✅" : "❌"}<br/>
        canCreate: {canCreate ? "✅" : "❌"}<br/>
        canDelete: {canDelete ? "✅" : "❌"}
      </div>

      <div style={{ fontSize: "10px", color: "#666" }}>
        <strong>Expected for Admin:</strong><br/>
        All permissions should be ✅ regardless of resourceOwnerId
      </div>
    </div>
  );
}
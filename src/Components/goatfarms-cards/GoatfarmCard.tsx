import type { GoatFarmDTO } from "../../Models/goatFarm";
import ButtonCard from "../buttons/ButtonCard";
import ButtonLink from "../buttons/ButtonLink";
import "./goatfarmsCards.css";

import { useAuth } from "@/contexts/AuthContext";
import { RoleEnum } from "@/Models/auth";
import { getOwnerByUserId } from "@/api/OwnerAPI/owners";
import { useEffect, useState } from "react";

type Props = {
  farm: GoatFarmDTO;
};

export default function GoatFarmCard({ farm }: Props) {
  const { isAuthenticated, tokenPayload } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isCheckingOwnership, setIsCheckingOwnership] = useState(true);

  // 1. Lógica de permissão unificada
  const roles = tokenPayload?.authorities ?? [];
  const isAdmin = roles.includes(RoleEnum.ROLE_ADMIN);

  // 2. Verificar se o usuário é proprietário através da API correta
  useEffect(() => {
    async function checkOwnership() {
      if (!tokenPayload?.userId) {
        setIsOwner(false);
        setIsCheckingOwnership(false);
        return;
      }

      try {
        const ownerData = await getOwnerByUserId(tokenPayload.userId);
        // Verifica se o proprietário encontrado é o mesmo da fazenda
        const userIsOwner = ownerData?.id === farm.ownerId;
        setIsOwner(userIsOwner);
        
        // Debug: Verificar associação correta
        console.log("VERIFICANDO DONO (CORRIGIDO):", {
          userIdNoToken: tokenPayload?.userId,
          ownerIdNoRecurso: farm.ownerId,
          ownerDataId: ownerData?.id,
          farmName: farm.name,
          isAdmin,
          isOwner: userIsOwner,
          canManage: isAuthenticated && (isAdmin || userIsOwner)
        });
      } catch (error) {
        console.error("Erro ao verificar propriedade:", error);
        setIsOwner(false);
      } finally {
        setIsCheckingOwnership(false);
      }
    }

    checkOwnership();
  }, [tokenPayload?.userId, farm.ownerId, farm.name, isAdmin, isAuthenticated]);

  // A condição principal: o usuário pode gerenciar (editar, excluir, etc.)?
  // Ele precisa estar autenticado E ser (admin OU o proprietário do recurso).
  const canManage = isAuthenticated && (isAdmin || isOwner);

  return (
    <div className="goatfarm-card">
      <h3>{farm.name}</h3>

      <p>
        <strong>TOD:</strong> {farm.tod}
      </p>

      <p>
        <strong>Proprietário:</strong> {farm.ownerName}
      </p>

      <p className="address-line">
        <strong>Endereço:</strong>
        <br />
        {`${farm.street}, ${farm.district}, ${farm.city} - ${farm.state}`}
        <br />
        {`CEP: ${farm.cep}`}
      </p>

      <p>
        <strong>Telefones:</strong>{" "}
        {farm.phones?.map((phone) => (
          <span key={phone.id} className="phone-item">
            <i className="fa-solid fa-phone"></i> ({phone.ddd}) {phone.number}
          </span>
        ))}
      </p>

      <div className="card-buttons">
        <ButtonLink to={`/cabras?farmId=${farm.id}`} label="🔍 Detalhes" />

        {/* 2. Usando a nova variável para ambos os botões de ação */}
        {canManage && (
          <>
            <ButtonLink
              to={`/fazendas/${farm.id}/editar`}
              label="Editar"
              className="edit"
            />
            <ButtonCard
              name="Excluir"
              className="delete"
              // TODO: conecte aqui sua função de exclusão
            />
          </>
        )}
      </div>
    </div>
  );
}

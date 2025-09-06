import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ButtonPrimary from "../../buttons/ButtonPrimary";
import ButtonOutline from "../../buttons/ButtonOutline";
import { useAuth } from "../../../contexts/AuthContext";
import { logOut } from "../../../services/auth-service";
import { getOwnerByUserId } from "../../../api/OwnerAPI/owners";
import { getAllFarmsPaginated } from "../../../api/GoatFarmAPI/goatFarm";
import "../../../index.css";
import "./styles.css";

export default function HeaderTopbar() {
  const navigate = useNavigate();
  // ✅ Adicionado tokenPayload de volta para exibir o nome do usuário
  const { isAuthenticated, setTokenPayload, tokenPayload } = useAuth();
  const [userHasFarm, setUserHasFarm] = useState(false);
  const [isCheckingFarm, setIsCheckingFarm] = useState(true);

  // Verificar se o usuário já tem fazenda cadastrada
  useEffect(() => {
    async function checkUserFarm() {
      if (!isAuthenticated || !tokenPayload?.userId) {
        setUserHasFarm(false);
        setIsCheckingFarm(false);
        return;
      }

      try {
        // Buscar proprietário pelo userId
        const ownerData = await getOwnerByUserId(tokenPayload.userId);
        
        if (ownerData?.id) {
          // Buscar todas as fazendas e verificar se alguma pertence ao usuário
          const farmsData = await getAllFarmsPaginated(0, 100); // Busca até 100 fazendas
          const userFarm = farmsData.content.find(farm => farm.ownerId === ownerData.id);
          setUserHasFarm(!!userFarm);
        } else {
          setUserHasFarm(false);
        }
      } catch (error) {
        console.error("Erro ao verificar fazenda do usuário:", error);
        setUserHasFarm(false);
      } finally {
        setIsCheckingFarm(false);
      }
    }

    checkUserFarm();
  }, [isAuthenticated, tokenPayload?.userId]);

  function handleLogout() {
    logOut();
    setTokenPayload(undefined);
    window.location.replace("/"); // Redireciona para a home após sair
  }

  return (
    <header className="topbar">
      <h1>Bem-vindo ao CapriGestor</h1>

      <div className="button-group-into">
        {/* ✅ Mensagem de boas-vindas restaurada */}
        {isAuthenticated && (
          <span style={{ marginRight: 8, color: '#333' }}>
            Olá, <strong>{tokenPayload?.user_name ?? "usuário"}</strong>
          </span>
        )}

        <ButtonPrimary
          label={isAuthenticated ? "Sair" : "Entrar"}
          icon={isAuthenticated ? "fa-solid fa-sign-out-alt" : "fa-solid fa-sign-in-alt"}
          onClick={() => (isAuthenticated ? handleLogout() : navigate("/login"))}
        />

        {/* ✅ Botão para DESLOGADOS: Leva para a página de CRIAR CONTA */}
        {!isAuthenticated && (
          <ButtonOutline
            to="/signup"
            label="Criar Conta"
            icon="fa-solid fa-user-plus"
          />
        )}
        
        {/* ✅ Novo Botão para LOGADOS: Leva para CADASTRAR NOVA FAZENDA (apenas se não tiver fazenda) */}
        {isAuthenticated && !isCheckingFarm && !userHasFarm && (
          <ButtonOutline
            to="/fazendas/novo"
            label="Nova Fazenda"
            icon="fa-solid fa-plus"
          />
        )}
      </div>
    </header>
  );
}
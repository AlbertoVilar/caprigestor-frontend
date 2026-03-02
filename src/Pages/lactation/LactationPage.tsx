import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LactationManager from "../../Components/lactation/LactationManager";
import PageHeader from "../../Components/pages-headers/PageHeader";
import { Button, LoadingState } from "../../Components/ui";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
import { usePermissions } from "../../Hooks/usePermissions";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import "../../index.css";
import "./lactationPages.css";

export default function LactationPage() {
  const { farmId, goatId } = useParams<{ farmId: string; goatId: string }>();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const { canManageLactation } = useFarmPermissions(Number(farmId));
  const canManage = permissions.isAdmin() || canManageLactation;

  useEffect(() => {
    async function loadGoat() {
      if (!farmId || !goatId) return;

      try {
        setLoading(true);
        const [goatResult] = await Promise.allSettled([fetchGoatById(Number(farmId), goatId)]);

        if (goatResult.status === "fulfilled") {
          setGoat(goatResult.value);
        } else {
          console.warn("Lactação: falha ao buscar dados da cabra", goatResult.reason);
        }
      } catch (error) {
        console.error("Erro ao carregar animal", error);
        toast.error("Erro ao carregar dados do animal.");
      } finally {
        setLoading(false);
      }
    }

    void loadGoat();
  }, [farmId, goatId]);

  if (loading) {
    return (
      <div className="gf-container module-page lactation-page">
        <LoadingState label="Preparando os dados do animal e o histórico de lactação." />
      </div>
    );
  }

  if (!farmId || !goatId) {
    return (
      <div className="gf-container module-page lactation-page">
        <div className="module-empty">
          Parâmetros inválidos para lactação. Verifique o link de acesso.
        </div>
      </div>
    );
  }

  const goatLabel = goat?.name || goatId;
  const goatRegistration = goat?.registrationNumber || goatId;
  const goatDetailPath = `/app/goatfarms/${farmId}/goats/${goatId}`;

  return (
    <div className="gf-container module-page lactation-page">
      <section className="lactation-page__hero">
        <PageHeader
          title={`Lactação de ${goatLabel}`}
          subtitle={`Registro: ${goatRegistration} · Fazenda · Cabra`}
          showBackButton
          backTo={goatDetailPath}
          actions={
            <div className="lactation-page__actions">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/app/goatfarms/${farmId}/goats/${goatId}/lactations/active`)
                }
              >
                <i className="fa-solid fa-eye" aria-hidden="true"></i> Lactação ativa
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/app/goatfarms/${farmId}/goats/${goatId}/milk-productions`)
                }
              >
                <i className="fa-solid fa-jug-detergent" aria-hidden="true"></i> Produção de leite
              </Button>
            </div>
          }
        />
      </section>

      <div className="page-content">
        <LactationManager
          farmId={Number(farmId)}
          goatId={goatId}
          goatName={goatLabel}
          canManage={canManage}
        />
      </div>
    </div>
  );
}

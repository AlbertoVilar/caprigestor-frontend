import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import GoatEventList from "../../Components/events/GoatEventList";
import SearchFilter from "../../Components/searchs/SearchFilter";
import { Button } from "../../Components/ui";
import { isAuthenticated } from "../../services/auth-service";
import { buildGoatDetailPath, buildGoatHealthPath } from "../../utils/appRoutes";

import "../../index.css";
import "./goatEventPage.css";

export default function GoatEventsPage() {
  const { registrationNumber } = useParams<{ registrationNumber: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    type: "",
    startDate: "",
    endDate: "",
  });

  const farmId = useMemo(() => searchParams.get("farmId"), [searchParams]);

  useEffect(() => {
    if (!isAuthenticated()) {
      console.log("Usuário não autenticado, redirecionando para login");
      navigate("/login");
    }
  }, [navigate]);

  const healthPath =
    registrationNumber && farmId
      ? buildGoatHealthPath(farmId, registrationNumber)
      : undefined;
  const goatDetailPath =
    registrationNumber && farmId
      ? buildGoatDetailPath(farmId, registrationNumber)
      : undefined;

  return (
    <div className="content-in">
      <div className="events-header-line">
        <h2 className="title">Eventos do Animal</h2>
        <div className="events-header-actions">
          <Button
            variant="outline"
            size="lg"
            className="events-header-button"
            onClick={() => {
              if (healthPath) {
                navigate(healthPath);
              }
            }}
            title="Gestão de saúde"
            disabled={!healthPath}
          >
            <i className="fa-solid fa-heart-pulse events-header-button__icon" aria-hidden="true"></i>
            Saúde
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="events-header-button"
            onClick={() => {
              if (goatDetailPath) {
                navigate(goatDetailPath);
                return;
              }
              navigate(-1);
            }}
          >
            Voltar para detalhes do animal
          </Button>
        </div>
      </div>

      <div className="box">
        <SearchFilter onFilter={setFilters} />
      </div>

      {registrationNumber ? (
        <GoatEventList
          registrationNumber={registrationNumber}
          farmId={Number(farmId)}
          filters={filters}
        />
      ) : (
        <p className="error-text">Número de registro da cabra não encontrado na URL.</p>
      )}
    </div>
  );
}

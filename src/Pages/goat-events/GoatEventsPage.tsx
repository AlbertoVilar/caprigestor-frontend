import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import GoatEventList from "../../Components/events/GoatEventList";
import SearchFilter from "../../Components/searchs/SearchFilter";
import { Button } from "../../Components/ui";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import { isAuthenticated } from "../../services/auth-service";
import { buildGoatDetailPath, buildGoatHealthPath } from "../../utils/appRoutes";
import "../../index.css";
import "./goatEventPage.css";

export default function GoatEventsPage() {
  const { registrationNumber, farmId: routeFarmId, goatId: routeGoatId } = useParams<{ registrationNumber?: string; farmId?: string; goatId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ type: "", startDate: "", endDate: "" });
  const farmId = useMemo(() => routeFarmId ?? searchParams.get("farmId"), [routeFarmId, searchParams]);
  const [resolvedRegistration, setResolvedRegistration] = useState(registrationNumber ?? "");

  useEffect(() => {
    if (!routeGoatId || !farmId) { setResolvedRegistration(registrationNumber ?? ""); return; }
    let cancelled = false;
    void fetchGoatById(Number(farmId), routeGoatId)
      .then((goat) => { if (!cancelled) setResolvedRegistration(goat.registrationNumber); })
      .catch(() => { if (!cancelled) setResolvedRegistration(""); });
    return () => { cancelled = true; };
  }, [farmId, registrationNumber, routeGoatId]);

  useEffect(() => { if (!isAuthenticated()) navigate("/login"); }, [navigate]);
  const internalGoatId = routeGoatId || resolvedRegistration;
  const healthPath = internalGoatId && farmId ? buildGoatHealthPath(farmId, internalGoatId) : undefined;
  const goatDetailPath = internalGoatId && farmId ? buildGoatDetailPath(farmId, internalGoatId) : undefined;

  return (
    <div className="content-in">
      <div className="events-header-line">
        <h2 className="title">Eventos do Animal</h2>
        <div className="events-header-actions">
          <Button variant="outline" size="lg" className="events-header-button" onClick={() => healthPath && navigate(healthPath)} title="Gestão de saúde" disabled={!healthPath}><i className="fa-solid fa-heart-pulse events-header-button__icon" aria-hidden="true" /> Saúde</Button>
          <Button variant="primary" size="lg" className="events-header-button" onClick={() => navigate(goatDetailPath || "/app/goatfarms")}>Voltar para detalhes do animal</Button>
        </div>
      </div>
      <div className="box"><SearchFilter onFilter={setFilters} /></div>
      {resolvedRegistration && farmId ? <GoatEventList registrationNumber={resolvedRegistration} farmId={Number(farmId)} filters={filters} /> : <p className="error-text">Não foi possível identificar o animal nesta fazenda.</p>}
    </div>
  );
}

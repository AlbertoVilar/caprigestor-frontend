import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ErrorState, LoadingState } from "../../Components/ui";
import FarmLogoImage from "../../Components/farm-logo/FarmLogoImage";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";
import {
  buildFarmDashboardPath,
  buildFarmGoatsPath,
} from "../../utils/appRoutes";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import "./publicCatalog.css";

const phoneHref = (ddd: string, number: string) =>
  `tel:+55${ddd.replace(/\D/g, "")}${number.replace(/\D/g, "")}`;

export default function PublicFarmPage() {
  const { farmId } = useParams();
  const { isAuthenticated } = useAuth();
  const permissions = usePermissions();
  const [farm, setFarm] = useState<GoatFarmDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFarm = async () => {
    const parsedFarmId = Number(farmId);
    if (!Number.isSafeInteger(parsedFarmId) || parsedFarmId <= 0) {
      setError("Identificador de fazenda inválido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setFarm(await getGoatFarmById(parsedFarmId));
    } catch (requestError) {
      setError(getApiErrorMessage(parseApiError(requestError)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFarm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  if (loading) return <LoadingState label="Carregando perfil da fazenda..." />;
  if (error || !farm) {
    return (
      <div className="public-catalog-page">
        <ErrorState
          title="Não foi possível carregar a fazenda"
          description={error || "Fazenda não encontrada."}
          onRetry={() => void loadFarm()}
        />
      </div>
    );
  }

  const location = [farm.city, farm.state].filter(Boolean).join(" - ");
  const canManage = isAuthenticated && permissions.canEditFarm(farm);

  return (
    <div className="public-catalog-page">
      <nav className="public-catalog-breadcrumb" aria-label="Navegação estrutural">
        <Link to="/fazendas">Fazendas</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{farm.name}</span>
      </nav>

      <section className="public-catalog-hero">
        <div className="public-catalog-logo">
          <FarmLogoImage src={farm.logoUrl} farmName={farm.name} />
        </div>
        <div>
          <span className="public-catalog-eyebrow">Perfil público da fazenda</span>
          <h1>{farm.name}</h1>
          <p>{location || "Localização não informada"}</p>
          {farm.tod && <span className="public-catalog-badge">TOD {farm.tod}</span>}
        </div>
      </section>

      <div className="public-catalog-grid">
        <section className="public-catalog-panel">
          <h2>Contato</h2>
          <dl className="public-catalog-data">
            <div><dt>Responsável</dt><dd>{farm.userName || farm.ownerName || "Não informado"}</dd></div>
            <div><dt>E-mail</dt><dd>{farm.userEmail ? <a href={`mailto:${farm.userEmail}`}>{farm.userEmail}</a> : "Não informado"}</dd></div>
          </dl>
          <div className="public-catalog-contacts">
            {farm.phones.length > 0 ? farm.phones.map((phone) => (
              <a key={phone.id || `${phone.ddd}-${phone.number}`} href={phoneHref(phone.ddd, phone.number)}>
                <i className="fa-solid fa-phone" aria-hidden="true" />
                ({phone.ddd}) {phone.number}
              </a>
            )) : <span>Nenhum telefone informado.</span>}
          </div>
        </section>

        <section className="public-catalog-panel public-catalog-panel--actions">
          <h2>Conheça o rebanho</h2>
          <p>Consulte os animais cadastrados e suas genealogias sem precisar entrar no sistema.</p>
          <Link className="public-catalog-primary" to={buildFarmGoatsPath(farm.id)}>
            Ver animais
          </Link>
          {canManage ? (
            <Link className="public-catalog-secondary" to={buildFarmDashboardPath(farm.id)}>
              Administrar fazenda
            </Link>
          ) : (
            <Link className="public-catalog-secondary" to="/login">
              Área do proprietário
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ErrorState, LoadingState } from "../../Components/ui";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import {
  buildFarmGoatsPath,
  buildGoatGenealogyPath,
  buildPublicFarmPath,
} from "../../utils/appRoutes";
import { getApiErrorMessage, parseApiError } from "../../utils/apiError";
import "./publicCatalog.css";

const formatDate = (value?: string) => {
  if (!value) return "Não informado";
  const safeValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  return new Date(safeValue).toLocaleDateString("pt-BR");
};

export default function PublicGoatPage() {
  const { farmId, goatId } = useParams();
  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGoat = async () => {
    const parsedFarmId = Number(farmId);
    if (!Number.isSafeInteger(parsedFarmId) || parsedFarmId <= 0 || !goatId) {
      setError("Identificador de animal inválido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setGoat(await fetchGoatById(parsedFarmId, goatId));
    } catch (requestError) {
      setError(getApiErrorMessage(parseApiError(requestError)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGoat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, goatId]);

  if (loading) return <LoadingState label="Carregando dados do animal..." />;
  if (error || !goat) {
    return (
      <div className="public-catalog-page">
        <ErrorState
          title="Não foi possível carregar o animal"
          description={error || "Animal não encontrado."}
          onRetry={() => void loadGoat()}
        />
      </div>
    );
  }

  const resolvedFarmId = goat.farmId || Number(farmId);
  const resolvedGoatId = goat.id ?? goat.registrationNumber;
  const fields = [
    ["Registro", goat.registrationNumber],
    ["Raça", goat.breed],
    ["Sexo", String(goat.gender || "")],
    ["Nascimento", formatDate(goat.birthDate)],
    ["Categoria", String(goat.category || "")],
    ["Pelagem", goat.color],
    ["TOD", goat.tod],
    ["TOE", goat.toe],
  ];

  return (
    <div className="public-catalog-page">
      <nav className="public-catalog-breadcrumb" aria-label="Navegação estrutural">
        <Link to="/fazendas">Fazendas</Link><span aria-hidden="true">/</span>
        <Link to={buildPublicFarmPath(resolvedFarmId)}>{goat.farmName || "Fazenda"}</Link><span aria-hidden="true">/</span>
        <Link to={buildFarmGoatsPath(resolvedFarmId)}>Animais</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{goat.name}</span>
      </nav>

      <section className="public-catalog-hero public-catalog-hero--animal">
        <div className="public-catalog-logo"><i className="fa-solid fa-cow" aria-hidden="true" /></div>
        <div>
          <span className="public-catalog-eyebrow">Perfil público do animal</span>
          <h1>{goat.name}</h1>
          <p>{goat.farmName || "Fazenda não informada"}</p>
          <span className="public-catalog-badge">{goat.status || "Situação não informada"}</span>
        </div>
      </section>

      <section className="public-catalog-panel">
        <h2>Identificação zootécnica</h2>
        <dl className="public-catalog-data public-catalog-data--animal">
          {fields.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value || "Não informado"}</dd></div>
          ))}
        </dl>
        <div className="public-catalog-actions">
          <Link className="public-catalog-primary" to={buildGoatGenealogyPath(resolvedFarmId, resolvedGoatId)}>
            Consultar genealogia
          </Link>
          <Link className="public-catalog-secondary" to={buildFarmGoatsPath(resolvedFarmId)}>
            Voltar ao rebanho
          </Link>
        </div>
      </section>
    </div>
  );
}

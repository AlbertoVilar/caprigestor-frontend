import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import { findGoatsByFarmIdPaginated } from "../../api/GoatAPI/goat";
import GoatFarmHeader from "../../Components/pages-headers/GoatFarmHeader";
import ContextBreadcrumb from "../../Components/pages-headers/ContextBreadcrumb";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import {
  buildFarmAlertsPath,
  buildFarmGoatsPath,
  buildFarmHealthAgendaPath,
  buildFarmInventoryPath,
} from "../../utils/appRoutes";
import "./FarmDashboardPage.css";

type FarmMetric = {
  label: string;
  value: string;
  icon: string;
};

type FarmActionCard = {
  title: string;
  description: string;
  icon: string;
  to: string;
  tone: "primary" | "secondary";
};

export default function FarmDashboardPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const farmIdNumber = useMemo(() => Number(farmId), [farmId]);
  const [farmData, setFarmData] = useState<GoatFarmDTO | null>(null);
  const [totalGoats, setTotalGoats] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Number.isNaN(farmIdNumber)) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadContext = async () => {
      try {
        const [farm, goatPage] = await Promise.all([
          getGoatFarmById(farmIdNumber),
          findGoatsByFarmIdPaginated(farmIdNumber, 0, 1),
        ]);

        if (cancelled) {
          return;
        }

        setFarmData(farm);
        setTotalGoats(goatPage.totalElements ?? goatPage.content.length);
      } catch (error) {
        console.error("Erro ao carregar o dashboard da fazenda", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadContext();

    return () => {
      cancelled = true;
    };
  }, [farmIdNumber]);

  if (Number.isNaN(farmIdNumber)) {
    return (
      <div className="farm-dashboard-page">
        <div className="alert alert-danger">Identificador da fazenda inválido.</div>
      </div>
    );
  }

  const farmName = farmData?.name || "Fazenda";
  const metrics: FarmMetric[] = [
    {
      label: "Rebanho",
      value: totalGoats == null ? "..." : `${totalGoats}`,
      icon: "fa-solid fa-cow",
    },
    {
      label: "Contexto",
      value: "Gestão da propriedade",
      icon: "fa-solid fa-tractor",
    },
    {
      label: "Acesso rápido",
      value: "Estoque, alertas e agenda",
      icon: "fa-solid fa-bolt",
    },
  ];

  const actionCards: FarmActionCard[] = [
    {
      title: "Estoque",
      description: "Cadastre produtos, acompanhe saldos e registre movimentações da fazenda.",
      icon: "fa-solid fa-boxes-stacked",
      to: buildFarmInventoryPath(farmIdNumber),
      tone: "primary",
    },
    {
      title: "Rebanho",
      description: "Acesse a lista de animais da fazenda e entre no detalhe de cada cabra.",
      icon: "fa-solid fa-goat",
      to: buildFarmGoatsPath(farmIdNumber),
      tone: "secondary",
    },
    {
      title: "Alertas",
      description: "Concentre pendências de reprodução, leite e sanidade em um só lugar.",
      icon: "fa-solid fa-bell",
      to: buildFarmAlertsPath(farmIdNumber),
      tone: "secondary",
    },
    {
      title: "Agenda da Fazenda",
      description: "Acompanhe compromissos sanitários e próximos eventos do rebanho.",
      icon: "fa-solid fa-calendar-days",
      to: buildFarmHealthAgendaPath(farmIdNumber),
      tone: "secondary",
    },
  ];

  return (
    <div className="farm-dashboard-page">
      <GoatFarmHeader
        name={farmName}
        logoUrl={farmData?.logoUrl}
        farmId={farmIdNumber}
      />

      <div className="farm-dashboard-page__content">
        <ContextBreadcrumb
          items={[
            { label: "Fazendas", to: "/goatfarms" },
            { label: farmName, to: buildFarmGoatsPath(farmIdNumber) },
            { label: "Dashboard da Fazenda" },
          ]}
        />

        <section className="farm-dashboard-hero" aria-label="Resumo da fazenda">
          <div>
            <span className="farm-dashboard-hero__eyebrow">Gerir a Fazenda</span>
            <h1 className="farm-dashboard-hero__title">{farmName}</h1>
            <p className="farm-dashboard-hero__description">
              Use este hub para ações da propriedade. Estoque, agenda, alertas e
              gestão do rebanho ficam aqui, separados do manejo de cada animal.
            </p>
          </div>

          <Link
            to={buildFarmInventoryPath(farmIdNumber)}
            className="farm-dashboard-hero__cta"
          >
            Abrir Estoque
          </Link>
        </section>

        <section className="farm-dashboard-metrics" aria-label="Indicadores da fazenda">
          {metrics.map((metric) => (
            <article key={metric.label} className="farm-dashboard-metric-card">
              <span className="farm-dashboard-metric-card__icon" aria-hidden="true">
                <i className={metric.icon}></i>
              </span>
              <span className="farm-dashboard-metric-card__label">{metric.label}</span>
              <strong className="farm-dashboard-metric-card__value">{metric.value}</strong>
            </article>
          ))}
        </section>

        <section className="farm-dashboard-actions" aria-label="Ações da fazenda">
          {actionCards.map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className={`farm-dashboard-action-card farm-dashboard-action-card--${card.tone}`}
            >
              <span className="farm-dashboard-action-card__icon" aria-hidden="true">
                <i className={card.icon}></i>
              </span>
              <div className="farm-dashboard-action-card__content">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </div>
              <span className="farm-dashboard-action-card__arrow" aria-hidden="true">
                <i className="fa-solid fa-arrow-right"></i>
              </span>
            </Link>
          ))}
        </section>

        {loading && (
          <div className="farm-dashboard-loading" role="status">
            Carregando dados da fazenda...
          </div>
        )}
      </div>
    </div>
  );
}

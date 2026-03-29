import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BlogSection from "../../Components/home/BlogSection";
import FarmsCarousel from "../../Components/home/FarmsCarousel";
import { getAllFarms } from "../../api/GoatFarmAPI/goatFarm";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import "./home.css";

type HeroHighlight = {
  label: string;
  value: string;
  meta: string;
  chip: string;
  icon: string;
};

export default function Home() {
  const [farms, setFarms] = useState<GoatFarmDTO[]>([]);

  useEffect(() => {
    getAllFarms()
      .then((data) => setFarms(data))
      .catch((err) => {
        if (err.response?.status !== 401) {
          console.error("Erro ao carregar fazendas:", err);
        }
      });
  }, []);

  const publicFarmCountLabel = farms.length > 0 ? String(farms.length) : "\u2014";

  const publicFarmProofCopy =
    farms.length === 1
      ? "Mais de 1 fazenda p\u00fablica j\u00e1 est\u00e1 vis\u00edvel no CapriGestor."
      : `Mais de ${farms.length} fazendas p\u00fablicas j\u00e1 est\u00e3o vis\u00edveis no CapriGestor.`;

  const heroHighlights = useMemo<HeroHighlight[]>(
    () => [
      {
        label: "Fazendas p\u00fablicas",
        value: publicFarmCountLabel,
        meta: "vis\u00edveis agora",
        chip: "ao vivo",
        icon: "fa-barn-silo",
      },
      {
        label: "Fluxos conectados",
        value: "Leite, sa\u00fade e reprodu\u00e7\u00e3o",
        meta: "sem alternar entre telas soltas",
        chip: "essencial",
        icon: "fa-diagram-project",
      },
      {
        label: "Rotina assistida",
        value: "Alertas e agenda no tempo certo",
        meta: "menos improviso no manejo di\u00e1rio",
        chip: "di\u00e1rio",
        icon: "fa-bell",
      },
      {
        label: "Vis\u00e3o clara",
        value: "Contexto por fazenda e por animal",
        meta: "decis\u00e3o mais r\u00e1pida na opera\u00e7\u00e3o",
        chip: "operacional",
        icon: "fa-eye",
      },
    ],
    [publicFarmCountLabel],
  );

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-stage">
          <div className="home-hero-copy-shell">
            <div className="home-hero-content">
              <div className="home-hero-badge">
                <span className="home-hero-badge__tag">{"Novo"}</span>
                <span>{"Gest\u00e3o clara para o manejo di\u00e1rio do seu capril."}</span>
              </div>

              <h1 className="home-hero-title">
                {"Gest\u00e3o inteligente"}
                <br />
                {"para sua "}
                <span className="home-hero-title__accent">{"cria\u00e7\u00e3o de"}</span>
                <br />
                <span className="home-hero-title__accent">{"caprinos."}</span>
              </h1>

              <p className="home-hero-description">
                {
                  "Organize rebanho, genealogia, lacta\u00e7\u00e3o e reprodu\u00e7\u00e3o em um \u00fanico lugar. A tecnologia que faltava para impulsionar sua produtividade rural."
                }
              </p>

              <div className="home-hero-btns">
                <Link to="/fazendas" className="home-hero-link home-hero-link--primary">
                  {"Come\u00e7ar agora"}
                </Link>
                <Link to="/sobre" className="home-hero-link home-hero-link--secondary">
                  {"Ver demonstra\u00e7\u00e3o"}
                </Link>
              </div>

              <div className="home-hero-social-proof" aria-label="Prova social da plataforma">
                <div className="home-hero-social-proof__avatars" aria-hidden="true">
                  <span className="home-hero-social-proof__avatar">
                    <i className="fa-solid fa-user" aria-hidden="true"></i>
                  </span>
                  <span className="home-hero-social-proof__avatar">
                    <i className="fa-solid fa-user-group" aria-hidden="true"></i>
                  </span>
                  <span className="home-hero-social-proof__avatar">
                    <i className="fa-solid fa-tractor" aria-hidden="true"></i>
                  </span>
                </div>
                <p>{publicFarmProofCopy}</p>
              </div>
            </div>
          </div>

          <div className="home-hero-visual">
            <div className="home-hero-visual-frame">
              <div className="home-hero-floating-card">
                <i className="fa-solid fa-chart-line" aria-hidden="true"></i>
                <div>
                  <span className="home-hero-floating-label">{"Efici\u00eancia operacional"}</span>
                  <strong>{"Rotina mais previs\u00edvel e produtiva"}</strong>
                </div>
              </div>

              <div className="home-hero-main-img">
                <img
                  src="/hero-goat.png"
                  alt="Cabras em uma fazenda"
                  width="1200"
                  height="900"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, (max-width: 1100px) 80vw, 560px"
                />
              </div>

              <div className="home-hero-visual-caption">
                <span className="home-hero-visual-caption__kicker">{"Fluxo \u00fanico"}</span>
                <strong>{"Mais clareza para conduzir a rotina da fazenda."}</strong>
                <span className="home-hero-visual-caption__meta">
                  {"Leite, sa\u00fade, reprodu\u00e7\u00e3o e hist\u00f3rico conectados."}
                </span>
              </div>

              <button
                type="button"
                className="home-hero-visual-action"
                aria-label="Explorar plataforma"
              >
                <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="home-hero-summary-grid">
          {heroHighlights.map((item) => (
            <article key={item.label} className="home-hero-summary-card">
              <div className="home-hero-summary-card__head">
                <span className="home-hero-summary-card__icon">
                  <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
                </span>
                <span className="home-hero-summary-card__chip">{item.chip}</span>
              </div>
              <span className="home-hero-summary-card__label">{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.meta}</p>
            </article>
          ))}
        </div>
      </section>

      <FarmsCarousel farms={farms} />
      <BlogSection />

      <section className="home-cta">
        <div className="home-cta-content">
          <h2>{"Pronto para transformar sua fazenda?"}</h2>
          <p>
            {"Junte-se a centenas de produtores que j\u00e1 modernizaram seu manejo com o CapriGestor. Teste gr\u00e1tis por 14 dias."}
          </p>
          <div className="home-cta-actions">
            <Link to="/signup" className="home-cta-primary">
              {"Cadastrar minha Fazenda"}
            </Link>
            <a
              href="mailto:contato@caprigestor.com.br?subject=Quero%20falar%20com%20um%20consultor%20do%20CapriGestor"
              className="home-cta-secondary"
            >
              {"Falar com um Consultor"}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

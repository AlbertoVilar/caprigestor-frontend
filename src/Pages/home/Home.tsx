import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BlogSection from "../../Components/home/BlogSection";
import FarmsCarousel from "../../Components/home/FarmsCarousel";
import { getAllFarms } from "../../api/GoatFarmAPI/goatFarm";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import "./home.css";

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

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-stage">
          <div className="hero-content">
            <div className="hero-badge">Plataforma profissional para gestão caprina</div>

            <h1 className="hero-title">Gestão clara para o manejo diário do seu capril.</h1>

            <p className="hero-description">
              Organize rebanho, genealogia, lactação, reprodução, saúde e estoque em um fluxo
              único, pensado para a rotina real da fazenda.
            </p>

            <div className="hero-btns">
              <Link to="/fazendas" className="hero-link hero-link--primary">
                Explorar fazendas
              </Link>
              <Link to="/sobre" className="hero-link hero-link--secondary">
                Conhecer a plataforma
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-frame">
              <div className="hero-floating-card">
                <i className="fa-solid fa-chart-line" aria-hidden="true"></i>
                <div>
                  <span className="hero-floating-label">Eficiência operacional</span>
                  <strong>Rotina mais previsível e produtiva</strong>
                </div>
              </div>

              <div className="hero-main-img">
                <img src="/hero-goat.png" alt="Cabras em uma fazenda" />
              </div>

              <div className="hero-insight-panel">
                <span className="hero-insight-kicker">Visão prática</span>
                <h2>Mais clareza para conduzir a rotina da fazenda sem improviso.</h2>
                <ul>
                  <li>Contexto por fazenda e por animal</li>
                  <li>Fluxos de leite, reprodução, saúde e estoque</li>
                  <li>Históricos e alertas para agir no tempo certo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-highlights">
          <article className="hero-highlight">
            <span className="hero-highlight__label">Rebanho</span>
            <strong>Cadastros e histórico em um só lugar</strong>
          </article>
          <article className="hero-highlight">
            <span className="hero-highlight__label">Rotina</span>
            <strong>Alertas, agenda e módulos conectados</strong>
          </article>
          <article className="hero-highlight">
            <span className="hero-highlight__label">Decisão</span>
            <strong>Mais visibilidade para agir rápido</strong>
          </article>
        </div>
      </section>

      <FarmsCarousel farms={farms} />
      <BlogSection />

      <section className="cta-banner">
        <div className="cta-content">
          <span className="cta-badge">Pronto para evoluir sua gestão?</span>
          <h2>Organize a fazenda com mais clareza e menos retrabalho.</h2>
          <p>
            Reúna cadastros, rotinas e indicadores em um ambiente único, pensado para o manejo
            caprino do dia a dia.
          </p>
          <div className="cta-actions">
            <Link to="/signup" className="signup-btn-large">
              Criar conta gratuita
            </Link>
            <Link to="/fazendas" className="cta-link-secondary">
              Ver fazendas públicas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

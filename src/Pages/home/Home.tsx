import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllFarms } from "../../api/GoatFarmAPI/goatFarm";
import type { GoatFarmDTO } from "../../Models/goatFarm";
import FarmsCarousel from "../../Components/home/FarmsCarousel";
import BlogSection from "../../Components/home/BlogSection";
import "./home.css";

export default function Home() {
  const [farms, setFarms] = useState<GoatFarmDTO[]>([]);

  useEffect(() => {
    getAllFarms()
      .then(data => setFarms(data))
      .catch(err => {
        if (err.response?.status !== 401) {
          console.error('Erro ao carregar fazendas:', err);
        }
      });
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">A revolução na gestão caprina</div>
          <h1 className="hero-title">
            Gestão inteligente para o seu <span className="text-gradient">Agronegócio</span>
          </h1>
          <p className="hero-description">
            Controle total do seu rebanho, genealogia e produtividade em uma única plataforma moderna e intuitiva.
          </p>
          <div className="hero-btns">
            <Link to="/fazendas" className="btn-primary-modern">
              Começar Agora
            </Link>
            <Link to="/sobre" className="btn-outline-modern">
              Saiba Mais
            </Link>
          </div>
        </div>
        <div className="hero-image-placeholder">
          <div className="floating-card c1">
            <i className="fa-solid fa-chart-line"></i>
            <span>+24% Produtividade</span>
          </div>
          <div className="floating-card c2">
            <i className="fa-solid fa-check-to-slot"></i>
            <span>Manejo Eficiente</span>
          </div>
          <div className="hero-main-img">
            <img src="/hero-goat.png" alt="Cabra Capril Vilar" />
          </div>
        </div>
      </section>

      {/* Farms Carousel Section */}
      <FarmsCarousel farms={farms} />

      {/* Blog Section */}
      <BlogSection />

      {/* Action Banner */}
      <section className="cta-banner">
        <div className="cta-content">
          <h2>Pronto para transformar sua criação?</h2>
          <p>Junte-se a centenas de produtores que já modernizaram seu manejo com o CapriGestor.</p>
          <Link to="/signup" className="signup-btn-large">
            Criar Conta Gratuita
          </Link>
        </div>
      </section>
    </div>
  );
}

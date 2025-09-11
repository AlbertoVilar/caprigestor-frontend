import type { GoatFarmDTO } from "../../Models/goatFarm";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "./welcome.css";

interface Props {
  farms: GoatFarmDTO[];
}

export default function WelcomeSection({ farms }: Props) {
  const totalFarms = farms.length;
  const totalAnimals = farms.reduce((sum, farm) => sum + (farm.totalAnimals || 0), 0);

  return (
    <div className="welcome-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Bem-vindo ao <span className="brand-highlight">CapriGestor</span>
            </h1>
            <p className="hero-subtitle">
              A plataforma completa para gestão de caprinos e ovinos.
              Controle seu rebanho, genealogia e dados com facilidade.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{totalFarms}</span>
                <span className="stat-label">Fazendas Cadastradas</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{totalAnimals}</span>
                <span className="stat-label">Animais Registrados</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">100%</span>
                <span className="stat-label">DIGITAL</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-icon">
              🐐
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Gestão Completa</h3>
            <p>Controle total do seu rebanho com relatórios detalhados</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧬</div>
            <h3>Genealogia</h3>
            <p>Árvore genealógica completa para melhoramento genético</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Acesso Móvel</h3>
            <p>Gerencie sua fazenda de qualquer lugar, a qualquer hora</p>
          </div>
        </div>
      </section>

      {/* Farms Showcase */}
      {farms.length > 0 && (
        <section className="farms-showcase">
          <div className="section-header">
            <h2>🏆 Fazendas Parceiras</h2>
            <p>Conheça alguns criadores que já utilizam o CapriGestor</p>
          </div>

          <Swiper
            modules={[Autoplay, Pagination]}
            slidesPerView={1}
            spaceBetween={20}
            loop={true}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 }
            }}
            className="farms-swiper"
          >
            {farms.map((farm) => (
              <SwiperSlide key={farm.id}>
                <div className="farm-card">
                  <div className="farm-logo-container">
                    <img
                      src={farm.logoUrl || "/img/default-capril.png"}
                      alt={farm.name}
                      className="farm-logo"
                    />
                  </div>
                  <div className="farm-info">
                    <h4 className="farm-name">{farm.name}</h4>
                    <p className="farm-owner">👤 {farm.ownerName}</p>
                    {farm.totalAnimals && (
                      <p className="farm-animals">🐐 {farm.totalAnimals} animais</p>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}
    </div>
  );
}

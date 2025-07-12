import type { GoatFarmDTO } from "../../Models/goatFarm";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "./welcome.css";

interface Props {
  farms: GoatFarmDTO[];
}

export default function WelcomeSection({ farms }: Props) {
  return (
    <section className="welcome-section">
      <h2>🐐 Capris registrados na plataforma</h2>
      <p>Conheça alguns criadores que já utilizam o CapriGestor:</p>

      <Swiper
        slidesPerView={3}
        spaceBetween={20}
        loop={true}
        autoplay={{ delay: 3000 }}
      >
        {farms.map((farm) => (
          <SwiperSlide key={farm.id}>
            <div className="farm-logo-card">
              <img
                src={farm.logoUrl || "/img/default-capril.png"}
                alt={farm.name}
                className="farm-logo"
              />
              <p className="farm-name">{farm.name}</p>
              <p className="farm-owner">👤 {farm.ownerName}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

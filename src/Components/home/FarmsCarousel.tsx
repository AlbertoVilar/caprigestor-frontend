import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import type { GoatFarmDTO } from '../../Models/goatFarm';
import { Link } from 'react-router-dom';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './home-components.css';

interface Props {
    farms: GoatFarmDTO[];
}

function FarmCard({ farm }: { farm: GoatFarmDTO }) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="farm-card-modern">
            <div className="farm-card-image">
                {farm.logoUrl && !imageError ? (
                    <img 
                        src={farm.logoUrl} 
                        alt={farm.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <i className="fa-solid fa-farm"></i>
                )}
            </div>
            <div className="farm-card-body">
                <h3 className="farm-name">{farm.name}</h3>
                <p className="farm-location">
                    <i className="fa-solid fa-location-dot"></i> {farm.city}, {farm.state}
                </p>
                <Link to={`/cabras?farmId=${farm.id}`} className="view-farm-btn">
                    Ver Detalhes
                </Link>
            </div>
        </div>
    );
}

export default function FarmsCarousel({ farms }: Props) {
    if (farms.length === 0) return null;

    return (
        <section className="farms-section">
            <div className="section-header">
                <h2 className="section-title">Capris Cadastrados</h2>
                <p className="section-subtitle">Conheça as fazendas que fazem parte da nossa rede.</p>
            </div>

            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000 }}
                breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                }}
                className="farms-swiper"
            >
                {farms.map((farm) => (
                    <SwiperSlide key={farm.id}>
                        <FarmCard farm={farm} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
}

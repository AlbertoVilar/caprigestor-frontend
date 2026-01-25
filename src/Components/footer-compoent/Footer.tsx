import { Link } from "react-router-dom";
import "./footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="modern-footer">
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-section footer-brand">
          <Link to="/" className="brand-logo">
            <i className="fa-solid fa-seedling"></i>
            <span>CapriGestor</span>
          </Link>
          <p>
            A plataforma definitiva para gestão inteligente de caprinocultura.
            Otimize sua produção, controle seu rebanho e potencialize seus resultados.
          </p>
          <div className="social-links">
            <a href="#" className="social-link" title="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#" className="social-link" title="LinkedIn">
              <i className="fa-brands fa-linkedin-in"></i>
            </a>
            <a href="#" className="social-link" title="YouTube">
              <i className="fa-brands fa-youtube"></i>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Navegação</h3>
          <ul className="footer-links">
            <li><Link to="/"><i className="fa-solid fa-chevron-right"></i> Início</Link></li>
            <li><Link to="/fazendas"><i className="fa-solid fa-chevron-right"></i> Fazendas</Link></li>
            <li><Link to="/cabras"><i className="fa-solid fa-chevron-right"></i> Animais</Link></li>
            <li><Link to="/genealogia"><i className="fa-solid fa-chevron-right"></i> Genealogia</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-section">
          <h3>Recursos</h3>
          <ul className="footer-links">
            <li><a href="#"><i className="fa-solid fa-book"></i> Guia de Nutrição</a></li>
            <li><a href="#"><i className="fa-solid fa-flask"></i> Produção de Leite</a></li>
            <li><a href="#"><i className="fa-solid fa-microscope"></i> Saúde Animal</a></li>
            <li><a href="#"><i className="fa-solid fa-newspaper"></i> Blog Agrotech</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-section">
          <h3>Contato</h3>
          <div className="contact-info">
            <div className="contact-item">
              <i className="fa-solid fa-location-dot"></i>
              <span>Sertão Paraibano, Brasil</span>
            </div>
            <div className="contact-item">
              <i className="fa-solid fa-envelope"></i>
              <span>contato@caprigestor.com.br</span>
            </div>
            <div className="contact-item">
              <i className="fa-solid fa-phone"></i>
              <span>+55 (83) 99999-9999</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">
          &copy; {currentYear} CapriGestor. Desenvolvido por <strong>Alberto Vilar</strong>.
        </p>
        <div className="footer-bottom-links">
          <a href="#">Privacidade</a>
          <a href="#">Termos de Uso</a>
          <a href="#">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
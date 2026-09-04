import { Link } from "react-router-dom";
import "./errorPages.css";

export default function NotFoundPage() {
  return (
    <div className="gf-error-page">
      <div className="gf-error-shell">
        <div className="gf-error-card">
          <div className="gf-error-eyebrow">Navegação</div>
          <h1 className="gf-error-code">404</h1>
          <h2 className="gf-error-title">Página não encontrada</h2>
          <p className="gf-error-description">O endereço informado não existe ou foi alterado.</p>
          <div className="gf-error-actions">
            <Link className="btn btn-success" to="/">Voltar ao início</Link>
            <Link className="btn btn-outline-success" to="/fazendas">Ver fazendas</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

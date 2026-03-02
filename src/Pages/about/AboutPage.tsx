import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body p-4 p-lg-5">
        <span className="badge text-bg-light mb-3">Sobre o CapriGestor</span>
        <h1 className="h2 mb-3">Gestão caprina com contexto claro e operação prática</h1>
        <p className="text-muted mb-4">
          O CapriGestor organiza a gestão da fazenda e o manejo individual de cada
          animal em fluxos separados, para reduzir ruído e facilitar a tomada de
          decisão no dia a dia.
        </p>

        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-4">
            <div className="rounded-4 border h-100 p-3">
              <h2 className="h5">Fazenda</h2>
              <p className="text-muted mb-0">
                Estoque, alertas, agenda sanitária e visão geral do rebanho.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="rounded-4 border h-100 p-3">
              <h2 className="h5">Animal</h2>
              <p className="text-muted mb-0">
                Sanidade, reprodução, lactações, produção de leite e histórico.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="rounded-4 border h-100 p-3">
              <h2 className="h5">Operação</h2>
              <p className="text-muted mb-0">
                Navegação direta, contratos estáveis e ações práticas para uso real.
              </p>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link to="/fazendas" className="btn btn-primary">
            Ver fazendas
          </Link>
          <Link to="/signup" className="btn btn-outline-secondary">
            Criar conta
          </Link>
        </div>
      </div>
    </section>
  );
}

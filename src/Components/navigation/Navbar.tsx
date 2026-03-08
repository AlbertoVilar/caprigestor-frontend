import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";
import "./navbar.css";

type NavLinkItem = {
  path: string;
  label: string;
  icon: string;
};

export default function Navbar() {
  const { pathname } = useLocation();
  const { tokenPayload, logout } = useAuth();
  const permissions = usePermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const accountLabel = tokenPayload?.user_name || tokenPayload?.userEmail || "Usuário";
  const firstName = accountLabel.trim().split(/\s+/)[0] || "Usuário";
  const avatarLetter = firstName.trim().charAt(0).toUpperCase() || "U";

  const navLinks = useMemo<NavLinkItem[]>(
    () => [
      { path: "/", label: "Início", icon: "fa-house" },
      { path: "/fazendas", label: "Fazendas", icon: "fa-tractor" },
      { path: "/cabras", label: "Cabras", icon: "fa-cow" },
      { path: "/blog", label: "Blog", icon: "fa-newspaper" },
    ],
    []
  );

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
    window.location.replace("/");
  };

  const renderNavLinks = (className: string) =>
    navLinks.map((link) => (
      <Link
        key={`${className}-${link.path}`}
        to={link.path}
        className={[className, pathname === link.path ? "active" : ""]
          .filter(Boolean)
          .join(" ")}
        aria-label={`Ir para ${link.label}`}
      >
        <i className={`fa-solid ${link.icon}`} aria-hidden="true"></i>
        <span>{link.label}</span>
      </Link>
    ));

  return (
    <>
      <nav className="modern-navbar" aria-label="Navegação principal">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand-link" aria-label="Ir para a página inicial">
            <div className="navbar-brand-logo">
              <img src="/logo_Caprigestor.png" alt="CapriGestor Logo" className="navbar-brand-logo__image" />
            </div>
            <span className="navbar-brand-name">CapriGestor</span>
          </Link>

          <div className="navbar-links">{renderNavLinks("navbar-link")}</div>

          <div className="navbar-actions">
            {permissions.isAdmin() && (
              <Link
                to="/app/editor/articles"
                className="navbar-editor-btn"
                title="Editor de artigos"
                aria-label="Abrir editor de artigos"
              >
                <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                <span className="navbar-editor-btn__label">Editor</span>
              </Link>
            )}

            <Link to="/fazendas/novo" className="navbar-create-btn" aria-label="Cadastrar nova fazenda">
              <i className="fa-solid fa-plus" aria-hidden="true"></i>
              <span>Cadastrar Fazenda</span>
            </Link>

            {tokenPayload ? (
              <div className="navbar-account-group">
                <div className="navbar-account-shell" aria-label={`Conta autenticada. Olá, ${firstName}`}>
                  <div className="navbar-account-avatar" aria-hidden="true">
                    {avatarLetter}
                  </div>
                </div>
                <button
                  type="button"
                  className="navbar-logout-btn"
                  onClick={handleLogout}
                  title="Sair"
                  aria-label="Sair da aplicação"
                >
                  <i className="fa-solid fa-sign-out-alt" aria-hidden="true"></i>
                </button>
              </div>
            ) : (
              <Link to="/login" className="navbar-login-btn" aria-label="Entrar na aplicação">
                Entrar
              </Link>
            )}
          </div>

          <button
            type="button"
            className="navbar-menu-toggle"
            aria-label={isMobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            <i className={`fa-solid ${isMobileMenuOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true"></i>
          </button>
        </div>
      </nav>

      <div
        className={`navbar-mobile-backdrop ${isMobileMenuOpen ? "is-open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden={!isMobileMenuOpen}
      />

      <aside
        id="mobile-nav-drawer"
        className={`navbar-mobile-drawer ${isMobileMenuOpen ? "is-open" : ""}`}
        aria-label="Menu de navegação móvel"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="navbar-mobile-drawer__header">
          <span className="navbar-mobile-drawer__title">Menu</span>
          <button
            type="button"
            className="navbar-mobile-drawer__close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fechar menu"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <nav className="navbar-mobile-drawer__links" aria-label="Links do menu móvel">
          {renderNavLinks("navbar-link navbar-link--drawer")}
        </nav>

        <div className="navbar-mobile-drawer__actions">
          {permissions.isAdmin() && (
            <Link
              to="/app/editor/articles"
              className="navbar-editor-btn navbar-editor-btn--drawer"
              aria-label="Abrir editor de artigos"
            >
              <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i>
              <span>Editor</span>
            </Link>
          )}

          <Link
            to="/fazendas/novo"
            className="navbar-create-btn navbar-create-btn--drawer"
            aria-label="Cadastrar nova fazenda"
          >
            <i className="fa-solid fa-plus" aria-hidden="true"></i>
            <span>Cadastrar Fazenda</span>
          </Link>

          <Link
            to="/sobre"
            className="navbar-link navbar-link--drawer navbar-link--secondary"
            aria-label="Saiba mais sobre o CapriGestor"
          >
            <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>Sobre</span>
          </Link>

          {tokenPayload ? (
            <button
              type="button"
              className="navbar-mobile-drawer__logout"
              onClick={handleLogout}
              aria-label="Sair da aplicação"
            >
              <i className="fa-solid fa-sign-out-alt" aria-hidden="true"></i>
              <span>Sair</span>
            </button>
          ) : (
            <Link to="/login" className="navbar-login-btn navbar-login-btn--drawer" aria-label="Entrar na aplicação">
              Entrar
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

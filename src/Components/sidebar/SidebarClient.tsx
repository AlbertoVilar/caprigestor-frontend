import { Link, useLocation } from "react-router-dom";
import '../../index.css';
import './sidebar.css';

interface SidebarClientProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function SidebarClient({ isCollapsed, onToggleCollapse }: SidebarClientProps) {
  const location = useLocation();

  const menuItems = [
    {
      path: "/",
      icon: "fa-solid fa-house",
      label: "Início",
      description: "Página inicial"
    },
    {
      path: "/goatfarms",
      icon: "fa-solid fa-search",
      label: "Buscar Capril",
      description: "Encontrar fazendas"
    },
    {
      path: "/criadores",
      icon: "fa-solid fa-users",
      label: "Ver Criadores",
      description: "Lista de criadores"
    },
    {
      path: "/genealogia",
      icon: "fa-solid fa-sitemap",
      label: "Genealogia",
      description: "Árvore genealógica"
    },
    {
      path: "/cabras",
      icon: "fa-solid fa-list",
      label: "Animais",
      description: "Gerenciar animais"
    },
    {
      path: "/relatorios",
      icon: "fa-solid fa-chart-line",
      label: "Relatórios",
      description: "Análises e dados"
    }
  ];

  return (
    <aside className={`modern-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="brand-section">
          <div className="brand-icon">
            <i className="fa-solid fa-seedling"></i>
          </div>
          {!isCollapsed && (
            <div className="brand-text">
              <h2 className="brand-name">CapriGestor</h2>
              <span className="brand-subtitle">Sistema de Gestão</span>
            </div>
          )}
        </div>
        
        <button 
          className="collapse-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <i className={`fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={index} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Link to={item.path} className="nav-link" title={item.description}>
                  <div className="nav-icon">
                    <i className={item.icon}></i>
                  </div>
                  {!isCollapsed && (
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  )}
                  {isActive && <div className="active-indicator"></div>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="footer-content">
            <div className="version-info">
              <i className="fa-solid fa-code"></i>
              <span>v2.0.1</span>
            </div>
            <div className="support-info">
              <i className="fa-solid fa-heart"></i>
              <span>Feito com amor</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

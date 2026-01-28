import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePermissions } from "../../Hooks/usePermissions";
import "./navbar.css";

export default function Navbar() {
    const { pathname } = useLocation();
    const { tokenPayload, logout } = useAuth();
    const permissions = usePermissions();

    const navLinks = [
        { path: "/", label: "Início", icon: "fa-house" },
        { path: "/fazendas", label: "Fazendas", icon: "fa-farm" },
        { path: "/cabras", label: "Cabras", icon: "fa-cow" },
        { path: "/blog", label: "Blog", icon: "fa-newspaper" },
    ];

    const handleLogout = () => {
        logout();
        window.location.replace("/");
    };

    return (
        <nav className="modern-navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <div className="brand-logo">
                        <i className="fa-solid fa-seedling"></i>
                    </div>
                    <span className="brand-name">CapriGestor</span>
                </Link>

                <div className="navbar-links">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-link ${pathname === link.path ? "active" : ""}`}
                        >
                            <i className={`fa-solid ${link.icon}`}></i>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="navbar-actions">
                    {permissions.isAdmin() && (
                        <Link to="/app/editor/articles" className="editor-btn">
                            <i className="fa-solid fa-pen-to-square"></i>
                            <span>Editor</span>
                        </Link>
                    )}
                    <Link to="/fazendas/novo" className="create-farm-btn">
                        <i className="fa-solid fa-plus"></i>
                        <span>Cadastrar Fazenda</span>
                    </Link>

                    {tokenPayload ? (
                        <div className="user-profile-group">
                            <div className="user-profile">
                                <div className="user-info-text">
                                    <span className="user-name">{tokenPayload.user_name}</span>
                                    <span className="user-email">{tokenPayload.userEmail}</span>
                                </div>
                                <div className="user-avatar">
                                    {tokenPayload.user_name?.charAt(0)}
                                </div>
                            </div>
                            <button className="navbar-logout-btn" onClick={handleLogout} title="Sair">
                                <i className="fa-solid fa-sign-out-alt"></i>
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="login-btn">
                            Entrar
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

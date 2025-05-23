import { Link } from "react-router-dom";
import '../../index.css';

export default function SidebarClient() {
  return (
    <div className="container">
      <aside className="sidebar">
        <h2><i className="fa-solid fa-goat"></i> CapriGestor</h2>
        <nav>
          <ul>
            <li className="active">
              <Link to="/"><i className="fa-solid fa-house"></i> Início</Link>
            </li>
            <li>
              <Link to="/goatfarms">
                <i className="fa-solid fa-magnifying-glass"></i> Buscar Capril
              </Link>
            </li>
            <li>
              <Link to="#"><i className="fa-solid fa-users"></i> Ver Criadores</Link>
            </li>
            <li>
              <Link to="#"><i className="fa-solid fa-tree"></i> Genealogia</Link>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  );
}

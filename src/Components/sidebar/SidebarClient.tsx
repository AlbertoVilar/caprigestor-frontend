import '../../index.css'

export default function SidebarClient() {
    return (
        <div className="container">
            <aside className="sidebar">
                <h2><i className="fa-solid fa-goat"></i> CapriGestor</h2>
                <nav>
                    <ul>
                        <li className="active"><i className="fa-solid fa-house"></i> Início</li>
                        <li><a href="../List-Farms/listFarms.html"><i className="fa-solid fa-magnifying-glass"></i> Buscar Capril</a></li>
                        <li><a href="#"><i className="fa-solid fa-users"></i> Ver Criadores</a></li>
                        <li><a href="../Genealogy/genealogy.html"><i className="fa-solid fa-tree"></i> Genealogia</a></li>
                    </ul>
                </nav>
            </aside>
        </div>
    );
}
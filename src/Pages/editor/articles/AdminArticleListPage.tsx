import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminArticles, setArticleHighlight, setArticlePublish } from "../../../api/BlogAPI/adminArticles";
import type { ArticleAdminDTO } from "../../../Models/ArticleDTOs";
import { getApiErrorMessage, parseApiError } from "../../../utils/apiError";
import "./adminArticles.css";

export default function AdminArticleListPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<ArticleAdminDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [totalPages, setTotalPages] = useState(0);

  const CATEGORIES = [
    { value: "", label: "Todas as categorias" },
    { value: "MANEJO", label: "Manejo" },
    { value: "SAUDE", label: "Saúde" },
    { value: "NUTRICAO", label: "Nutrição" },
    { value: "REPRODUCAO", label: "Reprodução" },
    { value: "PRODUTIVIDADE", label: "Produtividade" },
    { value: "GESTAO", label: "Gestão" },
    { value: "OUTROS", label: "Outros" },
  ];

  const load = async (pageOverride = page, categoryOverride = selectedCategory) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminArticles({ 
        page: pageOverride, 
        size: 12,
        category: categoryOverride || undefined 
      });
      setArticles(response.content || []);
      setTotalPages(response.totalPages || 0);
      setPage(response.number || 0);
    } catch (err: any) {
      const parsed = parseApiError(err);
      if (parsed.status === 401) {
        navigate("/login");
        return;
      }
      if (parsed.status === 403) {
        setError("Sem permissão para acessar o editor.");
        setArticles([]);
        return;
      }
      setError(getApiErrorMessage(parsed));
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleTogglePublish = async (article: ArticleAdminDTO) => {
    try {
      await setArticlePublish(article.id, article.status !== "PUBLISHED");
      await load(page, selectedCategory);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getApiErrorMessage(parsed));
    }
  };

  const handleToggleHighlight = async (article: ArticleAdminDTO) => {
    try {
      await setArticleHighlight(article.id, !article.highlighted);
      await load(page, selectedCategory);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getApiErrorMessage(parsed));
    }
  };

  return (
    <div className="admin-articles-page">
      <section className="admin-hero">
        <div>
          <h1>Editor de Artigos</h1>
          <p>Crie, edite e publique conteúdos do blog.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={selectedCategory} 
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(0);
            }}
            style={{ 
              padding: '0.6rem 1rem', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
              minWidth: '200px'
            }}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={() => navigate("/app/editor/articles/new")}>
            <i className="fa-solid fa-plus"></i> Novo artigo
          </button>
        </div>
      </section>

      {loading ? (
        <div className="admin-empty">Carregando...</div>
      ) : error ? (
        <div className="admin-empty">{error}</div>
      ) : articles.length === 0 ? (
        <div className="admin-empty">Nenhum artigo encontrado.</div>
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Status</th>
                <th>Destaque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <strong>{article.title}</strong>
                    <div className="admin-muted">{article.category || "Sem categoria"}</div>
                  </td>
                  <td>
                    <span className={`status-pill ${article.status === "PUBLISHED" ? "published" : "draft"}`}>
                      {article.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td>{article.highlighted ? "Sim" : "Não"}</td>
                  <td className="admin-actions">
                    <button className="btn-outline" onClick={() => navigate(`/app/editor/articles/${article.id}/edit`)}>
                      Editar
                    </button>
                    <button className="btn-outline" onClick={() => handleTogglePublish(article)}>
                      {article.status === "PUBLISHED" ? "Despublicar" : "Publicar"}
                    </button>
                    <button className="btn-outline" onClick={() => handleToggleHighlight(article)}>
                      {article.highlighted ? "Remover destaque" : "Destacar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="btn-outline" disabled={page <= 0} onClick={() => load(page - 1)}>
            Anterior
          </button>
          <span>
            Página {page + 1} de {totalPages}
          </span>
          <button
            className="btn-outline"
            disabled={page + 1 >= totalPages}
            onClick={() => load(page + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

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
  const [totalPages, setTotalPages] = useState(0);

  const load = async (pageOverride = page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminArticles({ page: pageOverride, size: 12 });
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
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePublish = async (article: ArticleAdminDTO) => {
    try {
      await setArticlePublish(article.id, article.status !== "PUBLISHED");
      await load(page);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getApiErrorMessage(parsed));
    }
  };

  const handleToggleHighlight = async (article: ArticleAdminDTO) => {
    try {
      await setArticleHighlight(article.id, !article.highlighted);
      await load(page);
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
        <button className="btn-primary" onClick={() => navigate("/app/editor/articles/new")}>
          <i className="fa-solid fa-plus"></i> Novo artigo
        </button>
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

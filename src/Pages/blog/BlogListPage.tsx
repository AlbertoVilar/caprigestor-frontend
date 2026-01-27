import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicArticles } from "../../api/BlogAPI/publicArticles";
import type { ArticlePublicDTO } from "../../Models/ArticleDTOs";
import "./blog.css";

const fallbackCover = "/hero-goat.png";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR");
};

export default function BlogListPage() {
  const [articles, setArticles] = useState<ArticlePublicDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const load = async (pageOverride = page) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPublicArticles({
        page: pageOverride,
        size: 9,
        q: q || undefined,
        category: category || undefined,
      });
      setArticles(response.content || []);
      setTotalPages(response.totalPages || 0);
      setPage(response.number || 0);
    } catch (err) {
      console.error("Erro ao carregar artigos", err);
      setError("Erro ao carregar artigos.");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    load(0);
  };

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <div>
          <h1>Blog CapriGestor</h1>
          <p>Conteúdo técnico sobre manejo, produção e reprodução caprina.</p>
        </div>
        <div className="blog-hero-actions">
          <input
            type="text"
            placeholder="Buscar por título ou conteúdo"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            type="text"
            placeholder="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button className="btn-primary" onClick={handleSearch}>
            Buscar
          </button>
        </div>
      </section>

      {loading ? (
        <div className="blog-empty">Carregando...</div>
      ) : error ? (
        <div className="blog-empty">{error}</div>
      ) : articles.length === 0 ? (
        <div className="blog-empty">Ainda não há artigos publicados.</div>
      ) : (
        <div className="blog-list">
          {articles.map((article) => (
            <article key={article.id} className="blog-item">
              <div className="blog-item-image">
                <img
                  src={article.coverImageUrl || fallbackCover}
                  alt={article.title}
                />
                {article.category && (
                  <span className="blog-tag">{article.category}</span>
                )}
              </div>
              <div className="blog-item-content">
                <div className="blog-item-meta">
                  {article.publishedAt && (
                    <span>{formatDate(article.publishedAt)}</span>
                  )}
                </div>
                <h2>{article.title}</h2>
                <p>{article.excerpt}</p>
                <Link to={`/blog/${article.slug}`} className="read-more-btn">
                  Ler mais <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="blog-pagination">
          <button
            className="btn-outline"
            disabled={page <= 0}
            onClick={() => load(Math.max(page - 1, 0))}
          >
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

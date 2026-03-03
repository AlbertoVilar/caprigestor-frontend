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
    } catch (err: unknown) {
      console.error("Erro ao carregar artigos:", err);

      let details = "";
      const response = (err as { response?: { data?: unknown } })?.response;

      if (response?.data) {
        if (typeof response.data === "string") {
          details = response.data.substring(0, 200) + "...";
        } else if (
          typeof response.data === "object" &&
          response.data !== null &&
          "message" in response.data
        ) {
          details = (response.data as { message?: string }).message ?? "";
        } else if (
          typeof response.data === "object" &&
          response.data !== null &&
          "error" in response.data
        ) {
          details = (response.data as { error?: string }).error ?? "";
        }
      } else if (err instanceof Error) {
        details = err.message;
      }

      setError("Não foi possível carregar os artigos agora.");
      if (details) console.error("Detalhes do erro:", details);
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

  const filtersActive = Boolean(q.trim() || category.trim());

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <div className="blog-hero-copy">
          <span className="blog-hero-kicker">Leituras para a rotina da fazenda</span>
          <h1>Blog CapriGestor</h1>
          <p>Conteúdo técnico sobre manejo, produção e reprodução caprina.</p>
        </div>

        <div className="blog-hero-search">
          <label className="blog-search-label" htmlFor="blog-search-query">
            Buscar artigos
          </label>
          <div className="blog-hero-actions">
            <input
              id="blog-search-query"
              type="text"
              placeholder="Buscar por título ou conteúdo"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <input
              id="blog-search-category"
              type="text"
              placeholder="Categoria (opcional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <button className="btn-primary blog-search-button" onClick={handleSearch}>
              Buscar
            </button>
          </div>
          <p className="blog-hero-hint">
            Filtre por tema ou procure um assunto específico para encontrar a leitura certa.
          </p>
        </div>
      </section>

      {!loading && !error && (
        <div className="blog-results-bar">
          <strong>
            {articles.length} {articles.length === 1 ? "artigo disponível" : "artigos disponíveis"}
          </strong>
          <span>
            {filtersActive
              ? `Filtros ativos: ${q.trim() || "sem termo"}${category.trim() ? ` · ${category.trim()}` : ""}`
              : "Selecione um artigo para continuar a leitura."}
          </span>
        </div>
      )}

      {loading ? (
        <div className="blog-empty">Carregando artigos...</div>
      ) : error ? (
        <div className="blog-empty">
          <p>{error}</p>
          <button className="btn-outline" onClick={() => load(0)} style={{ marginTop: "1rem" }}>
            Tentar novamente
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="blog-empty">Ainda não há artigos publicados.</div>
      ) : (
        <div className="blog-list">
          {articles.map((article) => (
            <article key={article.id} className="blog-item">
              <div className="blog-item-image">
                <img src={article.coverImageUrl || fallbackCover} alt={article.title} />
                {article.category && <span className="blog-tag">{article.category}</span>}
              </div>
              <div className="blog-item-content">
                <div className="blog-item-meta">
                  {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
                </div>
                <h2>{article.title}</h2>
                <p>{article.excerpt}</p>
                <Link to={`/blog/${article.slug}`} className="read-more-btn">
                  Ler mais <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
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

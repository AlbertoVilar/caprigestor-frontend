import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicArticleBySlug } from "../../api/BlogAPI/publicArticles";
import type { ArticlePublicDetailDTO } from "../../Models/ArticleDTOs";
import MarkdownRenderer from "../../Components/blog/MarkdownRenderer";
import "./blog.css";

const fallbackCover = "/hero-goat.png";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR");
};

const estimateReadingMinutes = (markdown?: string | null) => {
  const words = (markdown || "")
    .replace(/[#_*`>-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(3, Math.round(words / 190));
};

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticlePublicDetailDTO | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Artigo não encontrado.");
      setLoading(false);
      return;
    }

    getPublicArticleBySlug(slug)
      .then((data) => {
        setArticle(data);
        setError(null);
      })
      .catch((err: unknown) => {
        console.error("Erro ao carregar artigo", err);
        const response = (err as { response?: { status?: number } })?.response;
        if (response?.status === 404) {
          setError("Artigo não encontrado.");
        } else {
          setError("Erro ao carregar o artigo.");
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const readingMinutes = useMemo(
    () => estimateReadingMinutes(article?.contentMarkdown),
    [article?.contentMarkdown],
  );

  if (loading) {
    return <div className="blog-empty">Carregando artigo...</div>;
  }

  if (error || !article) {
    return (
      <div className="blog-empty">
        {error || "Artigo não encontrado."}
        <div style={{ marginTop: "1rem" }}>
          <Link to="/blog" className="btn-outline">
            Voltar para o blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-article">
      <Link to="/blog" className="blog-article-back">
        <i className="ph ph-arrow-left" aria-hidden="true"></i>
        Voltar para o blog
      </Link>

      <div className="blog-article-hero">
        <img src={article.coverImageUrl || fallbackCover} alt={article.title} loading="lazy" />
        <div className="blog-article-hero-overlay">
          {article.category && <span className="blog-tag blog-tag--floating">{article.category}</span>}
          <span className="blog-article-chip">{readingMinutes} min de leitura</span>
        </div>
      </div>

      <div className="blog-article-layout">
        <aside className="blog-article-aside">
          <div className="blog-article-aside-card">
            <span className="blog-article-aside-label">Publicado em</span>
            <strong>{formatDate(article.publishedAt) || "Data não informada"}</strong>
          </div>

          <div className="blog-article-aside-card">
            <span className="blog-article-aside-label">Leitura estimada</span>
            <strong>{readingMinutes} minutos</strong>
          </div>

          {article.category && (
            <div className="blog-article-aside-card">
              <span className="blog-article-aside-label">Tema</span>
              <strong>{article.category}</strong>
            </div>
          )}
        </aside>

        <article className="blog-article-content">
          <header className="blog-article-header">
            <span className="blog-article-kicker">Reportagem especial</span>
            <h1>{article.title}</h1>
            {article.excerpt && <p className="blog-article-deck">{article.excerpt}</p>}
          </header>

          <MarkdownRenderer markdown={article.contentMarkdown || ""} className="blog-markdown" />

          <div className="blog-article-footer">
            <Link to="/blog" className="btn-outline">
              Ler mais artigos
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}

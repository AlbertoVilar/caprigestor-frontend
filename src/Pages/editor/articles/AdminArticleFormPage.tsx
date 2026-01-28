import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createArticle,
  getAdminArticleById,
  setArticleHighlight,
  setArticlePublish,
  updateArticle,
} from "../../../api/BlogAPI/adminArticles";
import type { ArticleAdminDTO, ArticleCreateRequestDTO } from "../../../Models/ArticleDTOs";
import { getApiErrorMessage, parseApiError } from "../../../utils/apiError";
import MarkdownRenderer from "../../../Components/blog/MarkdownRenderer";
import "./adminArticles.css";

const ARTICLE_CATEGORIES = [
  { value: "MANEJO", label: "Manejo" },
  { value: "SAUDE", label: "Saúde" },
  { value: "NUTRICAO", label: "Nutrição" },
  { value: "REPRODUCAO", label: "Reprodução" },
  { value: "PRODUTIVIDADE", label: "Produtividade" },
  { value: "GESTAO", label: "Gestão" },
  { value: "OUTROS", label: "Outros" },
];

export default function AdminArticleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [article, setArticle] = useState<ArticleAdminDTO | null>(null);
  const [form, setForm] = useState<ArticleCreateRequestDTO>({
    title: "",
    category: "",
    excerpt: "",
    coverImageUrl: "",
    contentMarkdown: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAdminArticleById(Number(id));
        setArticle(data);
        setForm({
          title: data.title,
          category: data.category || "",
          excerpt: data.excerpt,
          coverImageUrl: data.coverImageUrl || "",
          contentMarkdown: data.contentMarkdown,
        });
      } catch (err: any) {
        const parsed = parseApiError(err);
        if (parsed.status === 401) {
          navigate("/login");
          return;
        }
        if (parsed.status === 403) {
          setError("Sem permissão para acessar o editor.");
          return;
        }
        setError(getApiErrorMessage(parsed));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const validate = () => {
    const errors: FormErrors = {};
    if (!form.title.trim()) errors.title = "Título é obrigatório.";
    if (!form.category.trim()) errors.category = "Categoria é obrigatória.";
    if (!form.excerpt.trim()) errors.excerpt = "Resumo é obrigatório.";
    if (!form.contentMarkdown.trim()) errors.contentMarkdown = "Conteúdo é obrigatório.";
    if (form.coverImageUrl && !/^https?:\/\//i.test(form.coverImageUrl)) {
      errors.coverImageUrl = "Informe uma URL válida.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const insertMarkdown = (prefix: string, suffix: string) => {
    const textarea = document.querySelector('textarea[name="contentMarkdown"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.contentMarkdown;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = `${before}${prefix}${selection || 'texto'}${suffix}${after}`;
    setForm(prev => ({ ...prev, contentMarkdown: newText }));
    
    // Defer focus restore
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length + (selection ? 0 : 5));
    }, 0);
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      setError(null);
      if (id) {
        await updateArticle(Number(id), form);
      } else {
        const created = await createArticle(form);
        navigate(`/app/editor/articles/${created.id}/edit`, { replace: true });
      }
      navigate("/app/editor/articles");
    } catch (err: any) {
      const parsed = parseApiError(err);
      if (parsed.status === 401) {
        navigate("/login");
        return;
      }
      if (parsed.status === 403) {
        setError("Sem permissão para acessar o editor.");
        return;
      }
      if (parsed.status === 409 || parsed.status === 422) {
        setError(parsed.message || getApiErrorMessage(parsed));
      } else {
        setError(getApiErrorMessage(parsed));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!article) return;
    try {
      await setArticlePublish(article.id, article.status !== "PUBLISHED");
      const updated = await getAdminArticleById(article.id);
      setArticle(updated);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getApiErrorMessage(parsed));
    }
  };

  const handleToggleHighlight = async () => {
    if (!article) return;
    try {
      await setArticleHighlight(article.id, !article.highlighted);
      const updated = await getAdminArticleById(article.id);
      setArticle(updated);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getApiErrorMessage(parsed));
    }
  };

  if (loading) {
    return <div className="admin-empty">Carregando...</div>;
  }

  if (error) {
    return <div className="admin-empty">{error}</div>;
  }

  return (
    <div className="admin-articles-page">
      <section className="admin-hero">
        <div>
          <h1>{id ? "Editar artigo" : "Novo artigo"}</h1>
          <p>Preencha as informações e publique quando estiver pronto.</p>
        </div>
        <div className="admin-hero-actions">
          <button className="btn-outline" onClick={() => setShowPreview((prev) => !prev)}>
            {showPreview ? "Ocultar preview" : "Pré-visualizar"}
          </button>
          {article && (
            <>
              <button className="btn-outline" onClick={handleTogglePublish}>
                {article.status === "PUBLISHED" ? "Despublicar" : "Publicar"}
              </button>
              <button className="btn-outline" onClick={handleToggleHighlight}>
                {article.highlighted ? "Remover destaque" : "Destacar"}
              </button>
            </>
          )}
        </div>
      </section>

      <div className="admin-form">
        <div className="admin-form-grid">
          <div>
            <label>Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            {formErrors.title && <p className="text-danger">{formErrors.title}</p>}
          </div>
          <div>
            <label>Categoria</label>
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              <option value="">Selecione uma categoria</option>
              {ARTICLE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {formErrors.category && <p className="text-danger">{formErrors.category}</p>}
          </div>
          <div>
            <label>Resumo</label>
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
            />
            {formErrors.excerpt && <p className="text-danger">{formErrors.excerpt}</p>}
          </div>
          <div>
            <label>Cover Image (URL)</label>
            <input
              type="text"
              value={form.coverImageUrl || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, coverImageUrl: e.target.value }))}
              placeholder="https://exemplo.com/imagem.jpg"
            />
            {formErrors.coverImageUrl && <p className="text-danger">{formErrors.coverImageUrl}</p>}
            {form.coverImageUrl && (
              <div style={{ marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', height: '150px', width: '266px', border: '1px solid #e2e8f0' }}>
                <img 
                  src={form.coverImageUrl} 
                  alt="Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>
          <div className="admin-form-markdown">
            <label>Conteúdo (Markdown)</label>
            <div className="markdown-toolbar">
              <button type="button" onClick={() => insertMarkdown('**', '**')} title="Negrito"><b>B</b></button>
              <button type="button" onClick={() => insertMarkdown('*', '*')} title="Itálico"><i>I</i></button>
              <button type="button" onClick={() => insertMarkdown('# ', '')} title="Título 1">H1</button>
              <button type="button" onClick={() => insertMarkdown('## ', '')} title="Título 2">H2</button>
              <button type="button" onClick={() => insertMarkdown('- ', '')} title="Lista">•</button>
              <button type="button" onClick={() => insertMarkdown('[', '](url)')} title="Link">Link</button>
              <button type="button" onClick={() => insertMarkdown('![', '](url)')} title="Imagem">Img</button>
            </div>
            <textarea
              name="contentMarkdown"
              rows={12}
              value={form.contentMarkdown}
              onChange={(e) => setForm((prev) => ({ ...prev, contentMarkdown: e.target.value }))}
            />
            {formErrors.contentMarkdown && <p className="text-danger">{formErrors.contentMarkdown}</p>}
          </div>
        </div>

        {showPreview && (
          <div className="admin-preview">
            <h3>Pré-visualização</h3>
            <MarkdownRenderer markdown={form.contentMarkdown} className="blog-markdown" />
          </div>
        )}

        <div className="admin-form-actions">
          <button className="btn-secondary" onClick={() => navigate("/app/editor/articles")}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

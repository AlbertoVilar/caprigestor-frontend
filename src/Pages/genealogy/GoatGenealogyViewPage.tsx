import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";

import ContextBreadcrumb from "../../Components/pages-headers/ContextBreadcrumb";
import GoatGenealogyTree from "../../Components/goat-genealogy/GoatGenealogyTree";
import { getComplementaryGenealogyAbcc, getGenealogy } from "../../api/GenealogyAPI/genealogy";
import { fetchGoatById } from "../../api/GoatAPI/goat";
import type { GenealogyNodeSource, GoatGenealogyDTO } from "../../Models/goatGenealogyDTO";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import {
  buildFarmDashboardPath,
  buildFarmGoatsPath,
  buildGoatDetailPath,
} from "../../utils/appRoutes";
import "./goatGenealogyViewPage.css";

type GenealogyMode = "LOCAL" | "ABCC";
type PrintCard = {
  relation: string;
  name: string;
  registration: string;
  source: GenealogyNodeSource;
};

function toNumberOrNull(value?: string): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSource(source?: GenealogyNodeSource): GenealogyNodeSource {
  if (source === "LOCAL" || source === "ABCC" || source === "AUSENTE") {
    return source;
  }
  return "AUSENTE";
}

function buildPrintCard(
  relation: string,
  input?: { nome?: string; registro?: string; source?: GenealogyNodeSource }
): PrintCard {
  const source = normalizeSource(input?.source);
  return {
    relation,
    name: input?.nome?.trim() || (source === "AUSENTE" ? "Não informado" : "XXXX"),
    registration: input?.registro?.trim() || (source === "AUSENTE" ? "-" : "XXXX"),
    source,
  };
}

function formatBirthDate(value?: string): string {
  const raw = (value || "").trim();
  if (!raw) {
    return "";
  }

  const parts = raw.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
  }

  return raw;
}

function getPrintableStyles(): string {
  return `
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 12px; color: #0f172a; }
    .genealogy-export-document { width: 100%; max-width: 1180px; margin: 0 auto; }
    .genealogy-export-document__header h2 { margin: 0 0 4px; font-size: 20px; }
    .genealogy-export-document__header p { margin: 2px 0; color: #475569; font-size: 14px; }
    .genealogy-export-document__note { margin-bottom: 8px !important; color: #334155; font-size: 12px; }
    .genealogy-export-tree { display: flex; flex-direction: column; gap: 8px; }
    .genealogy-export-row { display: grid; gap: 8px; grid-template-columns: repeat(8, minmax(0, 1fr)); }
    .genealogy-export-row--principal .genealogy-export-card { grid-column: 3 / span 4; }
    .genealogy-export-row--parents .genealogy-export-card { grid-column: span 4; }
    .genealogy-export-row--grandparents .genealogy-export-card { grid-column: span 2; }
    .genealogy-export-row--greatgrandparents .genealogy-export-card { grid-column: span 1; }
    .genealogy-export-card { border: 1.2px solid #9eb9e9; border-radius: 8px; min-height: 92px; padding: 8px; overflow: hidden; background: #ffffff; }
    .genealogy-export-card header { align-items: center; display: flex; justify-content: space-between; margin-bottom: 6px; gap: 8px; }
    .genealogy-export-card header strong { font-size: 12px; line-height: 1.2; }
    .genealogy-export-card header span { border-radius: 999px; font-size: 10px; font-weight: 700; padding: 2px 7px; }
    .genealogy-export-card > div { font-size: 15px; font-weight: 700; line-height: 1.25; word-break: break-word; }
    .genealogy-export-card small { color: #64748b; font-size: 12px; word-break: break-all; }
    .genealogy-export-card--principal { min-height: 152px; }
    .genealogy-export-card__meta { display: grid; gap: 4px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 6px; }
    .genealogy-export-card__meta-item { background: rgba(255, 255, 255, 0.65); border: 1px solid rgba(148, 163, 184, 0.45); border-radius: 6px; padding: 3px 5px; }
    .genealogy-export-card__meta-item span { color: #475569; display: block; font-size: 10px; line-height: 1.1; text-transform: uppercase; }
    .genealogy-export-card__meta-item strong { color: #0f172a; display: block; font-size: 12px; line-height: 1.2; margin-top: 1px; word-break: break-word; }
    .genealogy-export-card__line { color: #334155; font-size: 11px; line-height: 1.2; margin-top: 4px; word-break: break-word; }
    .genealogy-export-card--local { background: #eff9f3; border-color: #2f9462; }
    .genealogy-export-card--local header span { background: #dff3e7; color: #0f6b3d; }
    .genealogy-export-card--abcc { background: #f2f7ff; border-color: #5f8fd6; }
    .genealogy-export-card--abcc header span { background: #e2ecff; color: #1d4f9b; }
    .genealogy-export-card--ausente { background: #f7f8fa; border-color: #a0a9b8; }
    .genealogy-export-card--ausente header span { background: #eceff4; color: #4f5b6f; }
    @page { size: A4 landscape; margin: 8mm; }
  `;
}

export default function GoatGenealogyViewPage() {
  const { farmId: farmIdParam, goatId: goatIdParam } = useParams<{
    farmId: string;
    goatId: string;
  }>();

  const farmId = toNumberOrNull(farmIdParam);
  const goatId = goatIdParam ?? "";

  const [goat, setGoat] = useState<GoatResponseDTO | null>(null);
  const [genealogy, setGenealogy] = useState<GoatGenealogyDTO | null>(null);
  const [mode, setMode] = useState<GenealogyMode>("LOCAL");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [integrationMessage, setIntegrationMessage] = useState<string | null>(null);

  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!farmId || !goatId) {
      return;
    }

    let cancelled = false;

    const loadGoat = async () => {
      try {
        const goatData = await fetchGoatById(farmId, goatId);
        if (!cancelled) {
          setGoat(goatData);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Genealogia: falha ao carregar dados do animal", error);
        }
      }
    };

    void loadGoat();

    return () => {
      cancelled = true;
    };
  }, [farmId, goatId]);

  useEffect(() => {
    if (!farmId || !goatId) {
      return;
    }

    let cancelled = false;

    const loadInitialGenealogy = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await getGenealogy(farmId, goatId);
        if (cancelled) {
          return;
        }
        setGenealogy(response);
        setIntegrationMessage(response.integration?.message ?? null);
        setMode("LOCAL");
      } catch (error) {
        if (!cancelled) {
          console.error("Genealogia: falha ao carregar genealogia local", error);
          setErrorMessage("Não foi possível carregar a genealogia local deste animal.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialGenealogy();

    return () => {
      cancelled = true;
    };
  }, [farmId, goatId]);

  const loadLocalGenealogy = async () => {
    if (!farmId || !goatId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await getGenealogy(farmId, goatId);
      setGenealogy(response);
      setIntegrationMessage(response.integration?.message ?? null);
      setMode("LOCAL");
    } catch (error) {
      console.error("Genealogia: falha ao recarregar genealogia local", error);
      setErrorMessage("Não foi possível recarregar a genealogia local.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadComplementaryAbcc = async () => {
    if (!farmId || !goatId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await getComplementaryGenealogyAbcc(farmId, goatId);
      setGenealogy(response);
      setIntegrationMessage(response.integration?.message ?? null);
      setMode("ABCC");
    } catch (error) {
      console.error("Genealogia: falha ao carregar complemento ABCC", error);
      setErrorMessage("Não foi possível complementar a árvore com dados da ABCC agora.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printableRef.current) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=1400,height=900");
    if (!printWindow) {
      return;
    }

    const fileKey = goat?.registrationNumber || goatId || "genealogia";
    const content = printableRef.current.outerHTML;
    const styles = getPrintableStyles();

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Genealogia ${fileKey}</title>
          <style>${styles}</style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleSavePdf = () => {
    if (!printableRef.current) {
      return;
    }

    const fileKey = goat?.registrationNumber || goatId || "genealogia";
    const clone = printableRef.current.cloneNode(true) as HTMLDivElement;
    clone.style.position = "fixed";
    clone.style.left = "-12000px";
    clone.style.top = "0";
    clone.style.width = "1120px";
    clone.style.background = "#ffffff";
    document.body.appendChild(clone);

    html2pdf()
      .set({
        margin: 0.25,
        filename: `genealogia_${fileKey}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: "#ffffff", useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
        pagebreak: { mode: ["avoid-all", "css"] },
      })
      .from(clone)
      .save()
      .finally(() => {
        document.body.removeChild(clone);
      });
  };

  const resolvedFarmPath = farmId ? buildFarmDashboardPath(farmId) : "/goatfarms";
  const goatDetailPath = farmId && goatId ? buildGoatDetailPath(farmId, goatId) : "/cabras";
  const goatListPath = farmId ? buildFarmGoatsPath(farmId) : "/cabras";

  const breadcrumbItems = [
    { label: "Fazendas", to: "/goatfarms" },
    { label: goat?.farmName || "Fazenda", to: resolvedFarmPath },
    { label: "Cabras", to: goatListPath },
    { label: goat?.name || "Animal", to: goatDetailPath },
    { label: "Genealogia" },
  ];

  const principalCard = genealogy
    ? buildPrintCard("Animal principal", {
        nome: genealogy.animalPrincipal.nome,
        registro: genealogy.animalPrincipal.registro,
        source: genealogy.animalPrincipal.source || "LOCAL",
      })
    : null;

  const principalMetaItems = genealogy
    ? [
        {
          label: "Sexo",
          value: genealogy.animalPrincipal.sexo?.trim() || String(goat?.gender || "").trim(),
        },
        {
          label: "Raça",
          value: genealogy.animalPrincipal.raca?.trim() || goat?.breed?.trim() || "",
        },
        {
          label: "Pelagem",
          value: genealogy.animalPrincipal.pelagem?.trim() || goat?.color?.trim() || "",
        },
        {
          label: "Categoria",
          value:
            genealogy.animalPrincipal.categoria?.trim() || String(goat?.category || "").trim(),
        },
        {
          label: "Situação",
          value: genealogy.animalPrincipal.situacao?.trim() || String(goat?.status || "").trim(),
        },
        {
          label: "Nascimento",
          value: formatBirthDate(genealogy.animalPrincipal.dataNasc || goat?.birthDate),
        },
        {
          label: "TOD",
          value: genealogy.animalPrincipal.tod?.trim() || goat?.tod?.trim() || "",
        },
        {
          label: "TOE",
          value: genealogy.animalPrincipal.toe?.trim() || goat?.toe?.trim() || "",
        },
      ].map((item) => ({
        ...item,
        value: item.value?.trim() || "Não informado",
      }))
    : [];

  const principalCreator =
    genealogy?.animalPrincipal.criador?.trim() ||
    goat?.userName?.trim() ||
    goat?.ownerName?.trim() ||
    "Não informado";
  const principalOwner =
    genealogy?.animalPrincipal.proprietario?.trim() ||
    goat?.ownerName?.trim() ||
    goat?.farmName?.trim() ||
    "Não informado";

  const parentCards = genealogy
    ? [
        buildPrintCard("Pai", genealogy.pai),
        buildPrintCard("Mãe", genealogy.mae),
      ]
    : [];

  const grandparentCards = genealogy
    ? [
        buildPrintCard("Avô paterno", genealogy.avoPaterno),
        buildPrintCard("Avó paterna", genealogy.avoPaterna),
        buildPrintCard("Avô materno", genealogy.avoMaterno),
        buildPrintCard("Avó materna", genealogy.avoMaterna),
      ]
    : [];

  const bisavoPaternos = genealogy?.bisavosPaternos ?? [];
  const bisavoMaternos = genealogy?.bisavosMaternos ?? [];
  const greatGrandparentCards = genealogy
    ? [
        buildPrintCard("Bisavô paterno (pai)", bisavoPaternos[0]),
        buildPrintCard("Bisavó paterna (pai)", bisavoPaternos[1]),
        buildPrintCard("Bisavô paterno (mãe)", bisavoPaternos[2]),
        buildPrintCard("Bisavó paterna (mãe)", bisavoPaternos[3]),
        buildPrintCard("Bisavô materno (pai)", bisavoMaternos[0]),
        buildPrintCard("Bisavó materna (pai)", bisavoMaternos[1]),
        buildPrintCard("Bisavô materno (mãe)", bisavoMaternos[2]),
        buildPrintCard("Bisavó materna (mãe)", bisavoMaternos[3]),
      ]
    : [];

  return (
    <div className="content-in genealogy-view-page">
      <ContextBreadcrumb items={breadcrumbItems} />

      <section className="genealogy-view-page__hero">
        <div>
          <span className="genealogy-view-page__eyebrow">Genealogia do animal</span>
          <h1>Visualização completa</h1>
          <p>
            Consulte a árvore genealógica local e complemente com dados públicos da ABCC
            sem incorporar ancestrais ao rebanho.
          </p>
          <div className="genealogy-view-page__animal">
            <strong>{goat?.name || "Animal"}</strong>
            <span>Registro {goat?.registrationNumber || goatId}</span>
          </div>
        </div>

        <div className="genealogy-view-page__actions genealogy-view-print-actions">
          <button className="btn-secondary" onClick={loadLocalGenealogy} disabled={isLoading}>
            Dados locais
          </button>
          <button className="btn-secondary" onClick={loadComplementaryAbcc} disabled={isLoading}>
            Complementar com ABCC
          </button>
          <button className="btn-secondary" onClick={handlePrint} disabled={!genealogy}>
            Imprimir
          </button>
          <button className="btn-secondary" onClick={handleSavePdf} disabled={!genealogy}>
            Salvar em PDF
          </button>
          <Link className="btn-secondary" to={goatDetailPath}>
            Voltar ao animal
          </Link>
        </div>
      </section>

      <div className="genealogy-view-page__status">
        <span className={`genealogy-view-page__mode genealogy-view-page__mode--${mode.toLowerCase()}`}>
          Modo: {mode === "ABCC" ? "Complementar ABCC" : "Genealogia local"}
        </span>
        {integrationMessage && <span>{integrationMessage}</span>}
        <span>Dados ABCC são somente referência externa; não foram incorporados ao rebanho.</span>
      </div>

      {errorMessage && <div className="genealogy-view-page__error">{errorMessage}</div>}

      {isLoading && <div className="genealogy-view-page__loading">Carregando genealogia...</div>}

      {!isLoading && genealogy && (
        <div className="genealogy-view-page__canvas genealogy-view-page__canvas--interactive">
          <GoatGenealogyTree data={genealogy} />
        </div>
      )}

      {genealogy && principalCard && (
        <div ref={printableRef} className="genealogy-export-document">
          <header className="genealogy-export-document__header">
            <h2>Genealogia do animal</h2>
            <p>
              {goat?.name || genealogy.animalPrincipal.nome} · Registro{" "}
              {goat?.registrationNumber || genealogy.animalPrincipal.registro}
            </p>
            <p className="genealogy-export-document__note">
              Dados ABCC são somente referência externa; não foram incorporados ao rebanho.
            </p>
          </header>

          <section className="genealogy-export-tree">
            <div className="genealogy-export-row genealogy-export-row--principal">
              <article
                className={`genealogy-export-card genealogy-export-card--principal genealogy-export-card--${principalCard.source.toLowerCase()}`}
              >
                <header>
                  <strong>{principalCard.relation}</strong>
                  <span>{principalCard.source}</span>
                </header>
                <div>{principalCard.name}</div>
                <small>{principalCard.registration}</small>
                {principalMetaItems.length > 0 && (
                  <div className="genealogy-export-card__meta">
                    {principalMetaItems.map((item) => (
                      <div key={item.label} className="genealogy-export-card__meta-item">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                )}
                <div className="genealogy-export-card__line">Criador: {principalCreator}</div>
                <div className="genealogy-export-card__line">Proprietário: {principalOwner}</div>
              </article>
            </div>

            <div className="genealogy-export-row genealogy-export-row--parents">
              {parentCards.map((card) => (
                <article
                  key={card.relation}
                  className={`genealogy-export-card genealogy-export-card--${card.source.toLowerCase()}`}
                >
                  <header>
                    <strong>{card.relation}</strong>
                    <span>{card.source}</span>
                  </header>
                  <div>{card.name}</div>
                  <small>{card.registration}</small>
                </article>
              ))}
            </div>

            <div className="genealogy-export-row genealogy-export-row--grandparents">
              {grandparentCards.map((card) => (
                <article
                  key={card.relation}
                  className={`genealogy-export-card genealogy-export-card--${card.source.toLowerCase()}`}
                >
                  <header>
                    <strong>{card.relation}</strong>
                    <span>{card.source}</span>
                  </header>
                  <div>{card.name}</div>
                  <small>{card.registration}</small>
                </article>
              ))}
            </div>

            <div className="genealogy-export-row genealogy-export-row--greatgrandparents">
              {greatGrandparentCards.map((card) => (
                <article
                  key={card.relation}
                  className={`genealogy-export-card genealogy-export-card--${card.source.toLowerCase()}`}
                >
                  <header>
                    <strong>{card.relation}</strong>
                    <span>{card.source}</span>
                  </header>
                  <div>{card.name}</div>
                  <small>{card.registration}</small>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

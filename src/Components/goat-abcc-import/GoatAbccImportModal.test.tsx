import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  GoatAbccImportModalView,
  type GoatAbccImportModalViewProps,
} from "./GoatAbccImportModal";

function createBaseProps(): GoatAbccImportModalViewProps {
  return {
    raceOptions: [
      { id: 9, name: "SAANEN", normalizedBreed: "SAANEN" },
      { id: 2, name: "BOER", normalizedBreed: "BOER" },
    ],
    racesLoading: false,
    racesError: null,
    onRetryLoadRaces: vi.fn(),
    searchFilters: {
      raceName: "SAANEN",
      affix: "CAPRIL VILAR",
      page: "1",
      sex: "",
      tod: "",
      toe: "",
      name: "",
      dna: "",
    },
    onSearchFieldChange: vi.fn(),
    onSearchSubmit: vi.fn(),
    onResetFlow: vi.fn(),
    searching: false,
    searched: false,
    searchError: null,
    searchItems: [],
    selectedExternalId: null,
    onSelectSearchItem: vi.fn(),
    previewLoading: false,
    previewError: null,
    previewData: null,
    previewForm: null,
    onPreviewFieldChange: vi.fn(),
    onConfirmImport: vi.fn(),
    confirming: false,
    confirmError: null,
    confirmSuccess: null,
  };
}

describe("GoatAbccImportModalView", () => {
  it("renders ABCC optional import copy and search success list", () => {
    const html = renderToStaticMarkup(
      <GoatAbccImportModalView
        {...createBaseProps()}
        searched={true}
        searchItems={[
          {
            externalSource: "ABCC_PUBLIC",
            externalId: "ABCC-001",
            nome: "TOPAZIO",
            situacao: "RGD",
            dna: "SIM",
            tod: "12345",
            toe: "67890",
            criador: "ALBERTO",
            afixo: "CAPRIL VILAR",
            dataNascimento: "01/01/2020",
            sexo: "MACHO",
            raca: "SAANEN",
            pelagem: "CHAMOISEE",
            normalizedGender: "MACHO",
            normalizedBreed: "SAANEN",
            normalizedStatus: "ATIVO",
            normalizationWarnings: [],
          },
        ]}
      />
    );

    expect(html).toContain("Importação ABCC opcional");
    expect(html).toContain("TOPAZIO");
    expect(html).toContain("Pré-visualizar");
  });

  it("renders race loading state", () => {
    const html = renderToStaticMarkup(
      <GoatAbccImportModalView {...createBaseProps()} racesLoading={true} />
    );

    expect(html).toContain("Carregando raças da ABCC");
  });

  it("renders empty state after search with no items", () => {
    const html = renderToStaticMarkup(
      <GoatAbccImportModalView {...createBaseProps()} searched={true} searchItems={[]} />
    );

    expect(html).toContain("Nenhum animal encontrado na ABCC");
  });

  it("renders search error state", () => {
    const html = renderToStaticMarkup(
      <GoatAbccImportModalView
        {...createBaseProps()}
        searched={true}
        searchError="Falha de rede na ABCC"
      />
    );

    expect(html).toContain("Não foi possível consultar a ABCC");
    expect(html).toContain("Falha de rede na ABCC");
  });

  it("renders preview and confirm area", () => {
    const html = renderToStaticMarkup(
      <GoatAbccImportModalView
        {...createBaseProps()}
        selectedExternalId="ABCC-001"
        previewData={{
          externalSource: "ABCC_PUBLIC",
          externalId: "ABCC-001",
          registrationNumber: "1234567890",
          name: "TOPAZIO",
          gender: "MACHO",
          breed: "SAANEN",
          color: "CHAMOISEE",
          birthDate: "2020-01-01",
          status: "ATIVO",
          tod: "12345",
          toe: "67890",
          category: "PA",
          fatherName: "PAI",
          fatherRegistrationNumber: "1234511111",
          motherName: "MAE",
          motherRegistrationNumber: "1234522222",
          userName: "Alberto",
          farmId: 1,
          farmName: "Capril Vilar",
          normalizationWarnings: ["Categoria ABCC PCOD mapeada para PC por compatibilidade."],
        }}
        previewForm={{
          registrationNumber: "1234567890",
          name: "TOPAZIO",
          genderLabel: "Macho",
          breed: "SAANEN",
          color: "CHAMOISEE",
          birthDate: "2020-01-01",
          statusLabel: "Ativo",
          tod: "12345",
          toe: "67890",
          category: "PA",
          fatherRegistrationNumber: "1234511111",
          motherRegistrationNumber: "1234522222",
        }}
      />
    );

    expect(html).toContain("Pré-visualização e confirmação");
    expect(html).toContain("TOPAZIO");
    expect(html).toContain("Confirmar importação");
    expect(html).toContain("Atenção aos campos normalizados");
  });

  it("renders confirm error and success feedback", () => {
    const html = renderToStaticMarkup(
      <GoatAbccImportModalView
        {...createBaseProps()}
        selectedExternalId="ABCC-001"
        previewForm={{
          registrationNumber: "1234567890",
          name: "TOPAZIO",
          genderLabel: "Macho",
          breed: "SAANEN",
          color: "CHAMOISEE",
          birthDate: "2020-01-01",
          statusLabel: "Ativo",
          tod: "12345",
          toe: "67890",
          category: "PA",
          fatherRegistrationNumber: "",
          motherRegistrationNumber: "",
        }}
        previewData={{
          externalSource: "ABCC_PUBLIC",
          externalId: "ABCC-001",
          registrationNumber: "1234567890",
          name: "TOPAZIO",
          gender: "MACHO",
          breed: "SAANEN",
          color: "CHAMOISEE",
          birthDate: "2020-01-01",
          status: "ATIVO",
          tod: "12345",
          toe: "67890",
          category: "PA",
          fatherName: "",
          fatherRegistrationNumber: "",
          motherName: "",
          motherRegistrationNumber: "",
          userName: "Alberto",
          farmId: 1,
          farmName: "Capril Vilar",
          normalizationWarnings: [],
        }}
        confirmError="Registro já existente"
        confirmSuccess="Animal 1234567890 importado com sucesso."
      />
    );

    expect(html).toContain("Falha ao confirmar a importação");
    expect(html).toContain("Registro já existente");
    expect(html).toContain("Importação concluída com sucesso");
  });
});

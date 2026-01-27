export type ArticleStatus = "DRAFT" | "PUBLISHED";

export interface ArticlePublicDTO {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl?: string | null;
  category?: string | null;
  publishedAt?: string | null;
}

export interface ArticlePublicDetailDTO extends ArticlePublicDTO {
  contentMarkdown: string;
}

export interface ArticleAdminDTO extends ArticlePublicDTO {
  contentMarkdown: string;
  status: ArticleStatus;
  highlighted: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ArticleCreateRequestDTO {
  title: string;
  category: string;
  excerpt: string;
  coverImageUrl?: string | null;
  contentMarkdown: string;
}

export type ArticleUpdateRequestDTO = ArticleCreateRequestDTO;

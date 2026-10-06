export type ManagedFarmSummaryDTO = {
  id: number;
  name: string;
  tod?: string | null;
  logoUrl?: string | null;
};

export type ManagedFarmPage = {
  content: ManagedFarmSummaryDTO[];
  page: {
    size: number;
    number: number;
    totalPages: number;
    totalElements: number;
  };
};

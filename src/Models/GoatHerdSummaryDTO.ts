export interface GoatBreedSummaryDTO {
  breed: string;
  count: number;
}

export interface GoatHerdSummaryDTO {
  total: number;
  males: number;
  females: number;
  active: number;
  inactive: number;
  sold: number;
  deceased: number;
  breeds: GoatBreedSummaryDTO[];
}

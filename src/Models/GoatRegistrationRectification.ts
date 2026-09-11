export type RegistrationRectificationSource =
  | "ABCC"
  | "OFFICIAL_DOCUMENT"
  | "OTHER";

export interface GoatRegistrationRectificationRequest {
  tod: string;
  toe: string;
  source: RegistrationRectificationSource;
  evidenceReference: string;
  reason: string;
}

export interface GoatRegistrationRectificationResponse {
  technicalGoatId: number;
  previousRegistrationNumber: string;
  previousTod: string | null;
  previousToe: string | null;
  currentRegistrationNumber: string;
  currentTod: string | null;
  currentToe: string | null;
  source: RegistrationRectificationSource;
  changedAt: string;
}

export interface GoatRegistrationHistoryItem {
  id: number;
  technicalGoatId: number;
  farmId: number;
  oldRegistrationNumber: string;
  oldTod: string | null;
  oldToe: string | null;
  newRegistrationNumber: string;
  newTod: string | null;
  newToe: string | null;
  source: RegistrationRectificationSource;
  evidenceReference: string;
  reason: string;
  actorUserId: number;
  createdAt: string;
}


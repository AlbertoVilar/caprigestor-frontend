// src/types/api.ts

// Base types
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Farm types
export interface FarmResponseDTO {
  id: number;
  name: string;
  location: string;
  description?: string;
  ownerId: number;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface FarmRequestDTO {
  name: string;
  location: string;
  description?: string;
}

// Goat types
export interface GoatResponseDTO {
  id: number;
  name: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  status: 'ATIVO' | 'SOLD' | 'DECEASED';
  breed?: string;
  color?: string;
  weight?: number;
  motherId?: number;
  fatherId?: number;
  farmId: number;
  farmName: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoatRequestDTO {
  name: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  status: 'ATIVO' | 'SOLD' | 'DECEASED';
  breed?: string;
  color?: string;
  weight?: number;
  motherId?: number;
  fatherId?: number;
}

// Event types
export interface EventResponseDTO {
  id: number;
  type: string;
  description: string;
  eventDate: string;
  goatId: number;
  goatName: string;
  farmId: number;
  farmName: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventRequestDTO {
  type: string;
  description: string;
  eventDate: string;
  goatId: number;
}

// User types
export interface UserResponseDTO {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRequestDTO {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

// Auth types
export interface LoginRequestDTO {
  username: string;
  password: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDTO;
}

export interface RegisterRequestDTO {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken: string;
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  timestamp: string;
  path: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiValidationError extends ApiError {
  errors: ValidationError[];
}
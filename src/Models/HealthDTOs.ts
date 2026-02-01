
export enum HealthEventType {
    VACCINE = 'VACCINATION',
    EXAM = 'EXAM',
    ILLNESS = 'ILLNESS',
    TREATMENT = 'TREATMENT',
    HOOF_TRIMMING = 'HOOF_TRIMMING',
    DEWORMING = 'DEWORMING'
}

export enum HealthEventStatus {
    SCHEDULED = 'SCHEDULED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface HealthEventDTO {
    id: number;
    goatId: number;
    farmId: number;
    eventType: HealthEventType;
    date: string; // YYYY-MM-DD
    description: string;
    status: HealthEventStatus;
    
    // Campos específicos opcionais
    vaccineName?: string;
    batchNumber?: string;
    illnessName?: string;
    treatmentDetails?: string;
    cost?: number;
    performer?: string; // Quem realizou (veterinário/funcionário)
    
    createdAt?: string;
    updatedAt?: string;
}

export interface HealthEventCreateDTO {
    goatId: number;
    eventType: HealthEventType;
    date: string;
    description?: string;
    status?: HealthEventStatus;
    
    vaccineName?: string;
    batchNumber?: string;
    illnessName?: string;
    treatmentDetails?: string;
    cost?: number;
    performer?: string;
}

export interface HealthEventUpdateDTO {
    date?: string;
    description?: string;
    status?: HealthEventStatus;
    
    vaccineName?: string;
    batchNumber?: string;
    illnessName?: string;
    treatmentDetails?: string;
    cost?: number;
    performer?: string;
}

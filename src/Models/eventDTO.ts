// src/Models/EventDTO.ts

export interface EventRequestDTO {
  goatId: string; // número de registro da cabra
  eventType: string; // exemplo: "COBERTURA"
  date: string; // formato: "YYYY-MM-DD"
  description: string;
  location: string;
  veterinarian: string;
  outcome: string;
}

export interface EventResponseDTO {
  id: number;
  goatId: string;             // ✅ Adicione isto
  goatName: string;           // ✅ Adicione isto (caso queira exibir no futuro)
  eventType: string;
  date: string;
  description: string;
  location: string;
  veterinarian: string;
  outcome: string;
}

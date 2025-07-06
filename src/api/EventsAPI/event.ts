// src/API/EventsAPI/event.ts

import { EventResponseDTO } from "../../Models/eventDTO";
import { BASE_URL } from "../../utils/apiConfig"; // ✅ use a URL padronizada

export async function getGoatEvents(registrationNumber: string): Promise<EventResponseDTO[]> {
  const response = await fetch(`${BASE_URL}/goats/${registrationNumber}/events`);

  if (!response.ok) {
    throw new Error("Erro ao buscar eventos da cabra.");
  }

  const data = await response.json();
  return data.content; // ✅ porque é paginado
}

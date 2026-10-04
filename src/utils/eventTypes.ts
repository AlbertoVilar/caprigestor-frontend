export const GENERIC_WRITABLE_EVENT_TYPES = ["PESAGEM", "OUTRO"] as const;

export function isGenericEventWritable(eventType: string): boolean {
  return GENERIC_WRITABLE_EVENT_TYPES.some((writableType) => writableType === eventType);
}

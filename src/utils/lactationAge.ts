export type LactationAgeCheck = "missing-birth-date" | "before-birth" | "young" | "adult";

/** Compares ISO civil dates using the calendar anniversary, not elapsed days. */
export function classifyLactationAge(
  birthDate: string | null | undefined,
  startDate: string,
): LactationAgeCheck {
  if (!birthDate) return "missing-birth-date";
  if (startDate < birthDate) return "before-birth";

  const [year, month, day] = birthDate.split("-").map(Number);
  const anniversaryYear = year + 1;
  const lastDay = new Date(Date.UTC(anniversaryYear, month, 0)).getUTCDate();
  const anniversary = [
    anniversaryYear,
    String(month).padStart(2, "0"),
    String(Math.min(day, lastDay)).padStart(2, "0"),
  ].join("-");

  return startDate < anniversary ? "young" : "adult";
}

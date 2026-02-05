const pad2 = (value: string | number) => String(value).padStart(2, "0");

export const extractLocalDatePart = (value?: string | null) => {
  if (!value) return "";
  return value.split("T")[0];
};

export const formatLocalDatePtBR = (value?: string | null): string => {
  const datePart = extractLocalDatePart(value);
  if (!datePart) return "-";

  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return datePart;

  return `${pad2(day)}/${pad2(month)}/${year}`;
};

const toDateFromLocalString = (value: string): Date => {
  const datePart = extractLocalDatePart(value);
  return new Date(`${datePart}T00:00:00`);
};

const buildLocalDateString = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const toLocalDateInputValue = (value?: string | null): string => {
  const datePart = extractLocalDatePart(value);
  if (!datePart) return "";

  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return datePart;

  return `${year}-${pad2(month)}-${pad2(day)}`;
};

export const getTodayLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  return `${year}-${month}-${day}`;
};

export const addDaysLocalDate = (value: string, days: number): string => {
  const date = toDateFromLocalString(value);
  date.setDate(date.getDate() + days);
  return buildLocalDateString(date);
};

export const diffDaysLocalDate = (start: string, end: string): number => {
  const startDate = toDateFromLocalString(start);
  const endDate = toDateFromLocalString(end);
  const millisPerDay = 1000 * 60 * 60 * 24;
  return Math.round((endDate.getTime() - startDate.getTime()) / millisPerDay);
};

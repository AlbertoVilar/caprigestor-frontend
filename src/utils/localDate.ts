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

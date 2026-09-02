function dateParts(value: string | Date) {
  const iso =
    value instanceof Date ? toDateInputValue(value) : value.slice(0, 10);
  const [year, month, day] = iso.split("-").map(Number);
  return { iso, year, month, day };
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function currentWeekStart() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toDateInputValue(date);
}

export function addDateDays(value: string, days: number) {
  const { year, month, day } = dateParts(value);
  const date = new Date(year, month - 1, day + days, 12);
  return toDateInputValue(date);
}

export function formatDateOnly(value: string | Date) {
  const { year, month, day } = dateParts(value);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day, 12));
}

export function formatWeekRange(start: string | Date, end: string | Date) {
  return `${formatDateOnly(start)} – ${formatDateOnly(end)}`;
}

export function formatTimestamp(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

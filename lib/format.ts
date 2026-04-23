export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(0)}`;
}

export function formatHour(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric" }).toLowerCase();
}

export function formatDayLabel(date: Date): { weekday: string; day: string } {
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    day: String(date.getDate()),
  };
}

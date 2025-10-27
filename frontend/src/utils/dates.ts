/**
 * Retorna [from, to] (YYYY-MM-DD) para la semana actual, lunes a domingo.
 * Usa la zona horaria del navegador (en tu caso debe ser America/Guayaquil).
 */
export function getCurrentWeekRange(): { from: string; to: string; days: Date[] } {
  const now = new Date();
  const day = now.getDay(); // 0=Dom,1=Lun,...6=Sab
  const diffToMonday = (day === 0 ? -6 : 1 - day); // si es domingo, retrocede 6
  const monday = new Date(now);
  monday.setHours(0,0,0,0);
  monday.setDate(now.getDate() + diffToMonday);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  const to = new Date(monday);
  to.setDate(monday.getDate() + 6);
  to.setHours(23,59,59,999);

  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD
  return { from: toIsoDate(monday), to: toIsoDate(to), days };
}

export function formatDayHeader(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
}

export function startOfWeekMonday(d: Date) {
  const day = d.getDay(); // 0=Dom,1=Lun,...6=Sab
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() + diffToMonday);
  return monday;
}

export function getWeekRangeFrom(monday: Date): { from: string; to: string; days: Date[] } {
  const start = new Date(monday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);
  return { from: toIsoDate(start), to: toIsoDate(end), days };
}

export function addWeeks(date: Date, weeks: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export function formatDateUTC(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(d);
}
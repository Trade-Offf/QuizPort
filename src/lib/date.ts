export function startOfDayKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}


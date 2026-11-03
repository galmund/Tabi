const DAY_MS = 86_400_000;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

const toDate = (day: string) => new Date(`${day}T00:00:00Z`);
const toDay = (date: Date) => date.toISOString().slice(0, 10);

export function isIsoDay(value: string): boolean {
  return ISO_DAY.test(value) && !Number.isNaN(toDate(value).getTime()) && toDay(toDate(value)) === value;
}

export function isClock(value: string): boolean {
  return CLOCK.test(value);
}

export function addDays(day: string, amount: number): string {
  return toDay(new Date(toDate(day).getTime() + amount * DAY_MS));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS);
}

export function eachDay(from: string, toInclusive: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= toInclusive; day = addDays(day, 1)) days.push(day);
  return days;
}

const parts = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const longWeekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" });

function pieces(day: string) {
  const found = Object.fromEntries(parts.formatToParts(toDate(day)).map((part) => [part.type, part.value]));
  return { weekday: found.weekday, day: found.day, month: found.month };
}

export function formatDay(day: string): string {
  const { weekday, day: date, month } = pieces(day);
  return `${weekday} ${date} ${month}`;
}

export function formatShortDay(day: string): string {
  const { day: date, month } = pieces(day);
  return `${date} ${month}`;
}

export const formatWeekday = (day: string) => longWeekday.format(toDate(day));

export function formatRange(from: string, to: string): string {
  if (from === to) return formatShortDay(from);
  const [fromYear, fromMonth] = from.split("-");
  const [toYear, toMonth] = to.split("-");
  if (fromYear === toYear && fromMonth === toMonth) {
    return `${Number(from.slice(8))}–${formatShortDay(to)}`;
  }
  return `${formatShortDay(from)} – ${formatShortDay(to)}`;
}

export function todayIn(timeZone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA").format(now);
  }
}

export const plural = (count: number, word: string, many = `${word}s`) =>
  `${count} ${count === 1 ? word : many}`;

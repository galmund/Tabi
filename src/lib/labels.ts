import type { Currency, IdeaKind, Payment, Priority, TodoPhase, TravelMode } from "@/generated/prisma/enums";

export const TRAVEL_MODES = ["FLIGHT", "SHINKANSEN", "TRAIN", "BUS", "FERRY", "CAR", "OTHER"] as const;
export const IDEA_KINDS = ["SIGHT", "FOOD", "SHOPPING", "ONSEN", "EXPERIENCE", "NIGHTLIFE"] as const;
export const CURRENCIES = ["JPY", "ILS", "USD"] as const;
export const PAYMENTS = ["PAID", "DEPOSIT", "PAY_LATER"] as const;
export const PRIORITIES = ["MUST", "NICE"] as const;
export const TODO_PHASES = ["PLANNING", "BEFORE_TRIP"] as const;

export const TODO_PHASE_LABEL: Record<TodoPhase, string> = {
  PLANNING: "While planning",
  BEFORE_TRIP: "Week before trip",
};

export const TRAVEL_MODE_LABEL: Record<TravelMode, string> = {
  FLIGHT: "Flight",
  SHINKANSEN: "Shinkansen",
  TRAIN: "Train",
  BUS: "Bus",
  FERRY: "Ferry",
  CAR: "Car",
  OTHER: "Other",
};

export const IDEA_KIND_LABEL: Record<IdeaKind, string> = {
  SIGHT: "Sight",
  FOOD: "Food",
  SHOPPING: "Shopping",
  ONSEN: "Onsen",
  EXPERIENCE: "Experience",
  NIGHTLIFE: "Nightlife",
};

export const IDEA_KIND_COLOR: Record<IdeaKind, string> = {
  SIGHT: "#0a84ff",
  FOOD: "#ff9f0a",
  SHOPPING: "#bf5af2",
  ONSEN: "#64d2ff",
  EXPERIENCE: "#30d158",
  NIGHTLIFE: "#ff375f",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  MUST: "Must-do",
  NICE: "Nice-to-have",
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  JPY: "¥ Yen",
  ILS: "₪ Shekel",
  USD: "$ Dollar",
};

export const PAYMENT_LABEL: Record<Payment, string> = {
  PAID: "Paid",
  DEPOSIT: "Deposit paid",
  PAY_LATER: "Pay later",
};

export const CITY_COLORS = [
  "#30b0c7",
  "#af52de",
  "#34c759",
  "#ff9500",
  "#5856d6",
  "#ff2d55",
  "#007aff",
  "#a2845e",
  "#ffcc00",
  "#00c7be",
] as const;

const isOneOf =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === "string" && (values as readonly string[]).includes(value);

export const isTravelMode = isOneOf<TravelMode>(TRAVEL_MODES);
export const isIdeaKind = isOneOf<IdeaKind>(IDEA_KINDS);
export const isCurrency = isOneOf<Currency>(CURRENCIES);
export const isPayment = isOneOf<Payment>(PAYMENTS);
export const isPriority = isOneOf<Priority>(PRIORITIES);
export const isTodoPhase = isOneOf<TodoPhase>(TODO_PHASES);

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
}

export function googleMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function appleMapsUrl(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

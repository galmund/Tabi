import type { Currency, IdeaKind, Payment, Priority, TodoPhase, TravelMode } from "@/generated/prisma/enums";

export const TRAVEL_MODES = ["FLIGHT", "SHINKANSEN", "TRAIN", "BUS", "FERRY", "CAR", "OTHER"] as const;
export const IDEA_KINDS = ["SIGHT", "FOOD", "SHOPPING", "ONSEN", "EXPERIENCE", "NIGHTLIFE", "WALK"] as const;
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
  WALK: "Walking around",
};

export const IDEA_KIND_COLOR: Record<IdeaKind, string> = {
  SIGHT: "#2f6db5",
  FOOD: "#c46a14",
  SHOPPING: "#8e3b8f",
  ONSEN: "#2a8aa0",
  EXPERIENCE: "#3c8d6e",
  NIGHTLIFE: "#b8406a",
  WALK: "#a07d12",
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
  "#2a93a6",
  "#8e3b8f",
  "#3c8d6e",
  "#d9822b",
  "#6a5fb0",
  "#c4476a",
  "#2f6db5",
  "#8c6239",
  "#c99a1a",
  "#4f9f8f",
] as const;

const LEGACY_CITY_COLORS = [
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
];

export function cityColor(color: string): string {
  const index = LEGACY_CITY_COLORS.indexOf(color.toLowerCase());
  return index === -1 ? color : CITY_COLORS[index];
}

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

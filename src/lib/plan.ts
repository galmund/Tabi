import { addDays, daysBetween, eachDay } from "@/lib/dates";

type TripLike = { startDate: string; endDate: string };
type CityLike = { id: string; name: string; nameJa: string | null; color: string };
type StayLike = {
  id: string;
  status: "BOOKED" | "OPTION";
  checkIn: string;
  checkOut: string;
  cancelBy: string | null;
  city: CityLike;
};
type LegLike = { id: string; departDate: string; arriveDate: string | null };
type TodoLike = { id: string; done: boolean; dueDate: string | null };

export type Phase = "before" | "during" | "after";

export function tripPhase(trip: TripLike, today: string): Phase {
  if (today < trip.startDate) return "before";
  if (today > trip.endDate) return "after";
  return "during";
}

export const tripDays = (trip: TripLike) => eachDay(trip.startDate, trip.endDate);

export const tripNights = (trip: TripLike) =>
  trip.endDate > trip.startDate ? eachDay(trip.startDate, addDays(trip.endDate, -1)) : [];

export const nightsOf = (stay: { checkIn: string; checkOut: string }) =>
  Math.max(0, daysBetween(stay.checkIn, stay.checkOut));

export function bookedStayOn<S extends StayLike>(stays: S[], night: string): S | undefined {
  return stays.find((stay) => stay.status === "BOOKED" && stay.checkIn <= night && night < stay.checkOut);
}

export function overnightLegOn<L extends LegLike>(legs: L[], night: string): L | undefined {
  return legs.find((leg) => leg.arriveDate && leg.departDate <= night && night < leg.arriveDate);
}

export type NightState<S, L> =
  | { night: string; kind: "stay"; stay: S }
  | { night: string; kind: "transit"; leg: L }
  | { night: string; kind: "missing" };

export function nightStates<S extends StayLike, L extends LegLike>(
  trip: TripLike,
  stays: S[],
  legs: L[]
): NightState<S, L>[] {
  return tripNights(trip).map((night) => {
    const stay = bookedStayOn(stays, night);
    if (stay) return { night, kind: "stay", stay };
    const leg = overnightLegOn(legs, night);
    if (leg) return { night, kind: "transit", leg };
    return { night, kind: "missing" };
  });
}

export type NightRange = { from: string; to: string; nights: number };

export function missingRanges(states: NightState<unknown, unknown>[]): NightRange[] {
  const ranges: NightRange[] = [];
  for (const state of states) {
    if (state.kind !== "missing") continue;
    const last = ranges.at(-1);
    if (last && addDays(last.to, 1) === state.night) {
      last.to = state.night;
      last.nights += 1;
    } else {
      ranges.push({ from: state.night, to: state.night, nights: 1 });
    }
  }
  return ranges;
}

export type RouteSegment = {
  key: string;
  kind: "stay" | "transit" | "missing";
  city?: CityLike;
  from: string;
  nights: number;
};

export function routeSegments<S extends StayLike, L extends LegLike>(
  states: NightState<S, L>[]
): RouteSegment[] {
  const segments: RouteSegment[] = [];
  for (const state of states) {
    const city = state.kind === "stay" ? state.stay.city : undefined;
    const last = segments.at(-1);
    if (last && last.kind === state.kind && last.city?.id === city?.id) {
      last.nights += 1;
    } else {
      segments.push({ key: state.night, kind: state.kind, city, from: state.night, nights: 1 });
    }
  }
  return segments;
}

export function citiesOnDay<S extends StayLike>(stays: S[], day: string): CityLike[] {
  const cities: CityLike[] = [];
  for (const stay of [bookedStayOn(stays, addDays(day, -1)), bookedStayOn(stays, day)]) {
    if (stay && !cities.some((city) => city.id === stay.city.id)) cities.push(stay.city);
  }
  return cities;
}

export function isOutsideTrip(trip: TripLike, from: string, to: string | null): boolean {
  return from < trip.startDate || (to ?? from) > trip.endDate;
}

export function overlapsBooked<S extends StayLike>(stay: S, stays: S[]): S | undefined {
  return stays.find(
    (other) =>
      other.id !== stay.id &&
      other.status === "BOOKED" &&
      other.checkIn < stay.checkOut &&
      stay.checkIn < other.checkOut
  );
}

export type ComingUp<S, T> =
  | { kind: "cancel"; day: string; stay: S }
  | { kind: "todo"; day: string; todo: T };

export function comingUp<S extends StayLike, T extends TodoLike>(
  today: string,
  stays: S[],
  todos: T[],
  horizonDays = 45
): ComingUp<S, T>[] {
  const horizon = addDays(today, horizonDays);
  const items: ComingUp<S, T>[] = [];
  for (const stay of stays) {
    if (stay.status === "BOOKED" && stay.cancelBy && stay.cancelBy >= today && stay.cancelBy <= horizon) {
      items.push({ kind: "cancel", day: stay.cancelBy, stay });
    }
  }
  for (const todo of todos) {
    if (!todo.done && todo.dueDate && todo.dueDate <= horizon) {
      items.push({ kind: "todo", day: todo.dueDate, todo });
    }
  }
  return items.sort((a, b) => a.day.localeCompare(b.day));
}

export type DayOption = { day: string; number: number; cities: CityLike[]; planned: number };

export function dayOptions<S extends StayLike>(
  trip: TripLike,
  stays: S[],
  ideas: { day: string | null }[]
): DayOption[] {
  return tripDays(trip).map((day, index) => ({
    day,
    number: index + 1,
    cities: citiesOnDay(stays, day),
    planned: ideas.filter((idea) => idea.day === day).length,
  }));
}

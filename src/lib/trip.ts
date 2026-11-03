import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { THEME_COOKIE, TIME_ZONE_COOKIE, type ThemeChoice } from "@/lib/cookies";
import { todayIn } from "@/lib/dates";

export const TRIP_ID = "trip";

export const getTrip = cache(async () => {
  const existing = await prisma.trip.findUnique({ where: { id: TRIP_ID } });
  if (existing) return existing;
  await prisma.trip.createMany({ data: [{ id: TRIP_ID }], skipDuplicates: true });
  return prisma.trip.findUniqueOrThrow({ where: { id: TRIP_ID } });
});

export const getTripData = cache(async () => {
  const [trip, cities, stays, legs, ideas, todos, notes] = await Promise.all([
    getTrip(),
    prisma.city.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.stay.findMany({
      include: { city: true },
      orderBy: [{ checkIn: "asc" }, { status: "asc" }, { createdAt: "asc" }],
    }),
    prisma.travelLeg.findMany({
      orderBy: [{ departDate: "asc" }, { departTime: "asc" }, { createdAt: "asc" }],
    }),
    prisma.idea.findMany({
      include: { city: true },
      orderBy: [{ dayOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.todo.findMany({
      include: {
        stay: { select: { id: true, name: true } },
        leg: { select: { id: true, origin: true, destination: true, mode: true } },
        idea: { select: { id: true, name: true } },
      },
      orderBy: [{ done: "asc" }, { dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
    prisma.dayNote.findMany(),
  ]);
  return { trip, cities, stays, legs, ideas, todos, notes };
});

export type TripData = Awaited<ReturnType<typeof getTripData>>;
export type TripRow = TripData["trip"];
export type CityRow = TripData["cities"][number];
export type StayRow = TripData["stays"][number];
export type LegRow = TripData["legs"][number];
export type IdeaRow = TripData["ideas"][number];
export type TodoRow = TripData["todos"][number];

export async function getServerToday(): Promise<string> {
  const store = await cookies();
  return todayIn(store.get(TIME_ZONE_COOKIE)?.value ?? "Asia/Jerusalem");
}

export async function getThemeChoice(): Promise<ThemeChoice> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return value === "light" || value === "dark" ? value : "auto";
}

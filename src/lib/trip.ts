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

const photos = {
  select: { id: true },
  orderBy: { createdAt: "asc" as const },
};

export const photoSrc = (id: string) => `/photos/${id}`;

const withSources = <T extends { photos: { id: string }[] }>(row: T) => ({
  ...row,
  photos: row.photos.map((photo) => ({ id: photo.id, src: photoSrc(photo.id) })),
});

export const getTripData = cache(async () => {
  const [trip, cities, stays, legs, ideas, todos, notes, wishes] = await Promise.all([
    getTrip(),
    prisma.city.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.stay.findMany({
      include: { city: true, photos },
      orderBy: [{ checkIn: "asc" }, { status: "asc" }, { createdAt: "asc" }],
    }),
    prisma.travelLeg.findMany({
      include: { photos },
      orderBy: [{ departDate: "asc" }, { departTime: "asc" }, { createdAt: "asc" }],
    }),
    prisma.idea.findMany({
      include: { city: true, photos },
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
    prisma.wishItem.findMany({
      include: { city: true, photos },
      orderBy: [{ bought: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  return {
    trip,
    cities,
    stays: stays.map(withSources),
    legs: legs.map(withSources),
    ideas: ideas.map(withSources),
    todos,
    notes,
    wishes: wishes.map(withSources),
  };
});

export type TripData = Awaited<ReturnType<typeof getTripData>>;
export type TripRow = TripData["trip"];
export type CityRow = TripData["cities"][number];
export type StayRow = TripData["stays"][number];
export type LegRow = TripData["legs"][number];
export type IdeaRow = TripData["ideas"][number];
export type TodoRow = TripData["todos"][number];
export type WishRow = TripData["wishes"][number];

export async function getServerToday(): Promise<string> {
  const store = await cookies();
  return todayIn(store.get(TIME_ZONE_COOKIE)?.value ?? "Asia/Jerusalem");
}

export async function getThemeChoice(): Promise<ThemeChoice> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return value === "light" || value === "dark" ? value : "auto";
}

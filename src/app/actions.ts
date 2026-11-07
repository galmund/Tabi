"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { addDays, daysBetween, isClock, isIsoDay, normalizeClock } from "@/lib/dates";
import {
  CITY_COLORS,
  isCurrency,
  isIdeaKind,
  isPayment,
  isPriority,
  isTodoPhase,
  isTravelMode,
} from "@/lib/labels";
import { THEME_COOKIE, TIME_ZONE_COOKIE, type ThemeChoice } from "@/lib/cookies";
import { photoSrc, TRIP_ID } from "@/lib/trip";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

class InvalidInput extends Error {}

function refresh() {
  revalidatePath("/", "layout");
}

async function attempt(work: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const message = await work();
    refresh();
    return message ? { ok: true, message } : { ok: true };
  } catch (error) {
    if (error instanceof InvalidInput) return { ok: false, error: error.message };
    throw error;
  }
}

function text(form: FormData, key: string, max = 500): string | null {
  const value = form.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (trimmed.length > max) throw new InvalidInput(`That ${key} is too long.`);
  return trimmed;
}

function required(form: FormData, key: string, label: string, max = 200): string {
  const value = text(form, key, max);
  if (!value) throw new InvalidInput(`${label} is required.`);
  return value;
}

function day(form: FormData, key: string, label: string): string | null {
  const value = text(form, key, 10);
  if (value && !isIsoDay(value)) throw new InvalidInput(`${label} isn't a valid date.`);
  return value;
}

function requiredDay(form: FormData, key: string, label: string): string {
  const value = day(form, key, label);
  if (!value) throw new InvalidInput(`${label} is required.`);
  return value;
}

function clock(form: FormData, key: string, label: string): string | null {
  const value = text(form, key, 12);
  if (!value) return null;
  const normalized = normalizeClock(value);
  if (!normalized || !isClock(normalized)) throw new InvalidInput(`${label} isn't a valid time — try 11:30.`);
  return normalized;
}

function url(form: FormData, key: string): string | null {
  const value = text(form, key, 2000);
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    new URL(withScheme);
  } catch {
    throw new InvalidInput("That link doesn't look like a web address.");
  }
  return withScheme;
}

function money(form: FormData) {
  const raw = text(form, "price", 20)?.replace(/[,\s]/g, "");
  const price = raw ? Number(raw) : null;
  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    throw new InvalidInput("Price must be a positive number.");
  }
  const currency = form.get("currency");
  const payment = form.get("payment");
  return {
    price,
    currency: isCurrency(currency) ? currency : null,
    payment: isPayment(payment) ? payment : null,
  };
}

async function cityId(form: FormData, key = "city"): Promise<string | null> {
  const name = text(form, key, 60);
  if (!name) return null;
  const existing = await prisma.city.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;
  const count = await prisma.city.count();
  const created = await prisma.city.create({
    data: { name, color: CITY_COLORS[count % CITY_COLORS.length] },
    select: { id: true },
  });
  return created.id;
}

const MAX_PHOTO_BYTES = 3.5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_OWNERS = { stay: "stayId", leg: "legId", idea: "ideaId", wish: "wishId" } as const;

export type PhotoOwner = keyof typeof PHOTO_OWNERS;

function photoProblem(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return "Photos must be JPEG, PNG or WebP.";
  if (file.size > MAX_PHOTO_BYTES) {
    return `That photo is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 3.5 MB.`;
  }
  return null;
}

async function newPhotos(form: FormData) {
  const files = form.getAll("newPhotos").filter((value): value is File => value instanceof File && value.size > 0);
  for (const file of files) {
    const problem = photoProblem(file);
    if (problem) throw new InvalidInput(problem);
  }
  const photos = await Promise.all(
    files.map(async (file) => {
      const data = Buffer.from(await file.arrayBuffer());
      return { data, contentType: file.type, byteSize: data.byteLength };
    })
  );
  return photos.length > 0 ? { photos: { create: photos } } : {};
}

export async function rememberTimeZone(timeZone: string): Promise<void> {
  if (!/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(timeZone)) return;
  const store = await cookies();
  if (store.get(TIME_ZONE_COOKIE)?.value === timeZone) return;
  store.set(TIME_ZONE_COOKIE, timeZone, { maxAge: YEAR_IN_SECONDS, sameSite: "lax", path: "/" });
}

export async function setAppearance(choice: ThemeChoice): Promise<void> {
  const store = await cookies();
  if (choice === "auto") store.delete(THEME_COOKIE);
  else store.set(THEME_COOKIE, choice, { maxAge: YEAR_IN_SECONDS, sameSite: "lax", path: "/" });
  refresh();
}

export async function saveTrip(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const name = required(form, "name", "Trip name", 60);
    const startDate = requiredDay(form, "startDate", "Start date");
    const endDate = requiredDay(form, "endDate", "End date");
    if (endDate < startDate) throw new InvalidInput("The trip has to end after it starts.");

    await prisma.$transaction([
      prisma.trip.upsert({
        where: { id: TRIP_ID },
        update: { name, startDate, endDate },
        create: { id: TRIP_ID, name, startDate, endDate },
      }),
      prisma.idea.updateMany({
        where: { OR: [{ day: { lt: startDate } }, { day: { gt: endDate } }] },
        data: { day: null, time: null, dayOrder: 0 },
      }),
    ]);
    return "Trip saved";
  });
}

export async function saveStay(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const id = text(form, "id", 40);
    const checkIn = requiredDay(form, "checkIn", "Check-in");
    const checkOut = requiredDay(form, "checkOut", "Check-out");
    if (checkOut <= checkIn) throw new InvalidInput("Check-out has to be after check-in.");
    const city = await cityId(form);
    if (!city) throw new InvalidInput("City is required.");

    const data = {
      name: required(form, "name", "Name", 120),
      status: form.get("status") === "OPTION" ? ("OPTION" as const) : ("BOOKED" as const),
      cityId: city,
      checkIn,
      checkOut,
      checkInTime: clock(form, "checkInTime", "Check-in time") ?? "15:00",
      checkOutTime: clock(form, "checkOutTime", "Check-out time") ?? "11:00",
      address: text(form, "address", 300),
      bookingRef: text(form, "bookingRef", 80),
      url: url(form, "url"),
      cancelBy: day(form, "cancelBy", "Free cancellation date"),
      notes: text(form, "notes", 2000),
      ...money(form),
    };

    if (id) await prisma.stay.update({ where: { id }, data });
    else await prisma.stay.create({ data: { ...data, ...(await newPhotos(form)) } });
    return id ? "Stay saved" : "Stay added";
  });
}

export async function setStayStatus(id: string, status: "BOOKED" | "OPTION"): Promise<ActionResult> {
  return attempt(async () => {
    await prisma.stay.update({ where: { id }, data: { status } });
  });
}

export async function deleteStay(id: string): Promise<ActionResult> {
  return attempt(async () => {
    await prisma.stay.delete({ where: { id } });
  });
}

export async function saveLeg(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const id = text(form, "id", 40);
    const mode = form.get("mode");
    if (!isTravelMode(mode)) throw new InvalidInput("Pick how you're travelling.");
    const departDate = requiredDay(form, "departDate", "Departure date");
    const arriveDate = day(form, "arriveDate", "Arrival date");
    if (arriveDate && arriveDate < departDate) {
      throw new InvalidInput("Arrival can't be before departure.");
    }

    const data = {
      mode,
      origin: required(form, "origin", "From", 80),
      destination: required(form, "destination", "To", 80),
      departDate,
      departTime: clock(form, "departTime", "Departure time"),
      arriveDate: arriveDate && arriveDate !== departDate ? arriveDate : null,
      arriveTime: clock(form, "arriveTime", "Arrival time"),
      carrier: text(form, "carrier", 80),
      bookingRef: text(form, "bookingRef", 80),
      seat: text(form, "seat", 80),
      url: url(form, "url"),
      notes: text(form, "notes", 2000),
      ...money(form),
    };

    if (id) await prisma.travelLeg.update({ where: { id }, data });
    else await prisma.travelLeg.create({ data: { ...data, ...(await newPhotos(form)) } });
    return id ? "Travel saved" : "Travel added";
  });
}

export async function deleteLeg(id: string): Promise<ActionResult> {
  return attempt(async () => {
    await prisma.travelLeg.delete({ where: { id } });
  });
}

async function nextDayOrder(dayValue: string): Promise<number> {
  const last = await prisma.idea.findFirst({
    where: { day: dayValue },
    orderBy: { dayOrder: "desc" },
    select: { dayOrder: true },
  });
  return (last?.dayOrder ?? -1) + 1;
}

async function syncBookingTodo(ideaId: string, name: string, needsBooking: boolean) {
  const existing = await prisma.todo.findFirst({ where: { ideaId, fromIdea: true } });
  if (needsBooking && !existing) {
    await prisma.todo.create({ data: { title: `Book ${name}`, ideaId, fromIdea: true } });
  } else if (needsBooking && existing && !existing.done) {
    await prisma.todo.update({ where: { id: existing.id }, data: { title: `Book ${name}` } });
  } else if (!needsBooking && existing && !existing.done) {
    await prisma.todo.delete({ where: { id: existing.id } });
  }
}

export async function saveIdea(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const id = text(form, "id", 40);
    const kind = form.get("kind");
    const priority = form.get("priority");
    const scheduledDay = day(form, "day", "Day");
    const name = required(form, "name", "Name", 120);
    const needsBooking = form.get("needsBooking") === "on";

    const data = {
      name,
      kind: isIdeaKind(kind) ? kind : ("SIGHT" as const),
      priority: isPriority(priority) ? priority : ("NICE" as const),
      cityId: await cityId(form),
      mapsUrl: url(form, "mapsUrl"),
      notes: text(form, "notes", 2000),
      needsBooking,
      time: scheduledDay ? clock(form, "time", "Time") : null,
    };

    let ideaId = id;
    if (id) {
      const before = await prisma.idea.findUnique({ where: { id }, select: { day: true } });
      const dayChanged = (before?.day ?? null) !== scheduledDay;
      await prisma.idea.update({
        where: { id },
        data: {
          ...data,
          day: scheduledDay,
          ...(dayChanged ? { dayOrder: scheduledDay ? await nextDayOrder(scheduledDay) : 0 } : {}),
        },
      });
    } else {
      const created = await prisma.idea.create({
        data: {
          ...data,
          ...(await newPhotos(form)),
          day: scheduledDay,
          dayOrder: scheduledDay ? await nextDayOrder(scheduledDay) : 0,
        },
        select: { id: true },
      });
      ideaId = created.id;
    }
    await syncBookingTodo(ideaId!, name, needsBooking);
    return id ? "Idea saved" : "Idea added";
  });
}

export async function scheduleIdea(id: string, dayValue: string | null): Promise<ActionResult> {
  return attempt(async () => {
    if (dayValue && !isIsoDay(dayValue)) throw new InvalidInput("That isn't a valid day.");
    await prisma.idea.update({
      where: { id },
      data: dayValue
        ? { day: dayValue, dayOrder: await nextDayOrder(dayValue) }
        : { day: null, time: null, dayOrder: 0 },
    });
  });
}

export async function moveActivity(id: string, dayValue: string, ids: string[]): Promise<ActionResult> {
  return attempt(async () => {
    if (!isIsoDay(dayValue)) throw new InvalidInput("That isn't a valid day.");
    if (!ids.includes(id)) throw new InvalidInput("That activity isn't in the new order.");
    await prisma.$transaction([
      prisma.idea.update({ where: { id }, data: { day: dayValue } }),
      ...ids.map((ideaId, index) =>
        prisma.idea.updateMany({ where: { id: ideaId, day: dayValue }, data: { dayOrder: index } })
      ),
    ]);
  });
}

export async function shiftLeg(id: string, fromDay: string, toDay: string): Promise<ActionResult> {
  return attempt(async () => {
    if (!isIsoDay(fromDay) || !isIsoDay(toDay)) throw new InvalidInput("That isn't a valid day.");
    const shift = daysBetween(fromDay, toDay);
    if (shift === 0) return;
    const leg = await prisma.travelLeg.findUnique({ where: { id }, select: { departDate: true, arriveDate: true } });
    if (!leg) throw new InvalidInput("That travel no longer exists.");
    await prisma.travelLeg.update({
      where: { id },
      data: {
        departDate: addDays(leg.departDate, shift),
        arriveDate: leg.arriveDate ? addDays(leg.arriveDate, shift) : null,
      },
    });
  });
}

export async function deleteIdea(id: string): Promise<ActionResult> {
  return attempt(async () => {
    await prisma.idea.delete({ where: { id } });
  });
}

export async function saveTodo(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const id = text(form, "id", 40);
    const [kind, linkId] = (text(form, "link", 60) ?? "").split(":");
    const phase = form.get("phase");
    const fields = {
      title: required(form, "title", "To-do", 200),
      dueDate: day(form, "dueDate", "Due date"),
      phase: isTodoPhase(phase) ? phase : "PLANNING",
    };
    const link = {
      stayId: kind === "stay" ? linkId : null,
      legId: kind === "leg" ? linkId : null,
      ideaId: kind === "idea" ? linkId : null,
    };
    if (id) {
      const existing = await prisma.todo.findUnique({ where: { id }, select: { fromIdea: true } });
      await prisma.todo.update({
        where: { id },
        data: existing?.fromIdea ? fields : { ...fields, ...link },
      });
    } else {
      await prisma.todo.create({ data: { ...fields, ...link } });
    }
    return id ? "To-do saved" : "To-do added";
  });
}

export async function setTodoDone(id: string, done: boolean): Promise<ActionResult> {
  return attempt(async () => {
    await prisma.todo.update({ where: { id }, data: { done, doneAt: done ? new Date() : null } });
  });
}

export async function deleteTodo(id: string): Promise<ActionResult> {
  return attempt(async () => {
    const todo = await prisma.todo.delete({ where: { id } });
    if (todo.fromIdea && todo.ideaId) {
      await prisma.idea.update({ where: { id: todo.ideaId }, data: { needsBooking: false } });
    }
  });
}

export async function saveWish(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const id = text(form, "id", 40);
    const { price, currency } = money(form);
    const data = {
      name: required(form, "name", "Name", 120),
      forWhom: text(form, "forWhom", 60),
      cityId: await cityId(form),
      price,
      currency: price !== null ? (currency ?? "JPY") : null,
      url: url(form, "url"),
      notes: text(form, "notes", 2000),
    };
    if (id) await prisma.wishItem.update({ where: { id }, data });
    else await prisma.wishItem.create({ data: { ...data, ...(await newPhotos(form)) } });
    return id ? "Saved" : "Added to the wish list";
  });
}

export async function setWishBought(id: string, bought: boolean): Promise<ActionResult> {
  return attempt(async () => {
    await prisma.wishItem.update({ where: { id }, data: { bought, boughtAt: bought ? new Date() : null } });
  });
}

export async function deleteWish(id: string): Promise<ActionResult> {
  return attempt(async () => {
    await prisma.wishItem.delete({ where: { id } });
  });
}

export async function saveDayNote(dayValue: string, note: string): Promise<ActionResult> {
  return attempt(async () => {
    if (!isIsoDay(dayValue)) throw new InvalidInput("That isn't a valid day.");
    const trimmed = note.trim();
    if (trimmed.length > 4000) throw new InvalidInput("That note is too long.");
    if (trimmed === "") await prisma.dayNote.deleteMany({ where: { day: dayValue } });
    else
      await prisma.dayNote.upsert({
        where: { day: dayValue },
        update: { text: trimmed },
        create: { day: dayValue, text: trimmed },
      });
  });
}

export async function setDayCity(dayValue: string, id: string, on: boolean): Promise<ActionResult> {
  return attempt(async () => {
    if (!isIsoDay(dayValue)) throw new InvalidInput("That isn't a valid day.");
    if (on) {
      await prisma.dayCity.createMany({ data: [{ day: dayValue, cityId: id }], skipDuplicates: true });
    } else {
      await prisma.dayCity.deleteMany({ where: { day: dayValue, cityId: id } });
    }
  });
}

export async function addDayCity(dayValue: string, name: string): Promise<ActionResult> {
  return attempt(async () => {
    if (!isIsoDay(dayValue)) throw new InvalidInput("That isn't a valid day.");
    const form = new FormData();
    form.set("city", name);
    const id = await cityId(form);
    if (!id) throw new InvalidInput("Type a city name.");
    await prisma.dayCity.createMany({ data: [{ day: dayValue, cityId: id }], skipDuplicates: true });
  });
}

export async function saveCity(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  return attempt(async () => {
    const id = text(form, "id", 40);
    const name = required(form, "name", "Name", 60);
    const color = text(form, "color", 7);
    if (color && !/^#[0-9a-f]{6}$/i.test(color)) throw new InvalidInput("Pick a colour.");
    const clash = await prisma.city.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, NOT: id ? { id } : undefined },
      select: { id: true },
    });
    if (clash) throw new InvalidInput(`There's already a city called ${name}.`);

    const data = { name, nameJa: text(form, "nameJa", 30), ...(color ? { color } : {}) };
    if (id) await prisma.city.update({ where: { id }, data });
    else
      await prisma.city.create({
        data: { ...data, color: color ?? CITY_COLORS[(await prisma.city.count()) % CITY_COLORS.length] },
      });
    return id ? "City saved" : "City added";
  });
}

export async function deleteCity(id: string): Promise<ActionResult> {
  return attempt(async () => {
    const stays = await prisma.stay.count({ where: { cityId: id } });
    if (stays > 0) throw new InvalidInput("Stays still use this city.");
    await prisma.city.delete({ where: { id } });
  });
}

export type UploadResult = { ok: true; photo: { id: string; src: string } } | { ok: false; error: string };

export async function uploadPhoto(form: FormData): Promise<UploadResult> {
  const owner = form.get("owner");
  const ownerId = form.get("ownerId");
  const file = form.get("photo");
  if (typeof owner !== "string" || !(owner in PHOTO_OWNERS) || typeof ownerId !== "string" || !ownerId) {
    return { ok: false, error: "Save it first, then add photos." };
  }
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No photo was selected." };
  const problem = photoProblem(file);
  if (problem) return { ok: false, error: problem };

  const data = Buffer.from(await file.arrayBuffer());
  const photo = await prisma.photo.create({
    data: {
      data,
      contentType: file.type,
      byteSize: data.byteLength,
      [PHOTO_OWNERS[owner as PhotoOwner]]: ownerId,
    },
    select: { id: true },
  });
  refresh();
  return { ok: true, photo: { id: photo.id, src: photoSrc(photo.id) } };
}

export async function deletePhoto(id: string): Promise<ActionResult> {
  return attempt(async () => {
    await prisma.photo.deleteMany({ where: { id } });
  });
}

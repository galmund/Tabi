# ⛩️ Tabi (旅)

The planner for our Japan trip, **23 Sep – 26 Oct 2027**, shared by the two of us.

It answers three questions, fast, from a phone:

1. *Where do we sleep each night, and which nights are still empty?*
2. *What's on today, and how do we get to the next place?*
3. *What do we still have to book or do before we go?*

<br>

## What's in it

| Tab          | What it does |
| ------------ | ------------ |
| **Home**     | Before the trip: a countdown, the route bar (each city in its own colour, empty nights hatched red), **nights with no hotel yet**, and **Coming up** (free-cancellation deadlines and to-dos that are due). Once the trip starts it switches to **today**: where we are, today's plan, and tonight's hotel with its address, booking number and map buttons. |
| **Days**     | One card per day from start to end. Each shows that day's travel, the activities (drag to reorder, optional time), a free-text note, and where we sleep — or a red "No hotel booked" that opens a new stay for exactly that night. |
| **Bookings** | **Stays** (hotels and ryokans: Booked or Option, check-in/out, booking number, link, address, price + currency + payment status, free-cancellation date) and **Travel** (flights, shinkansen, trains, buses, ferries, with times exactly as printed on the ticket). |
| **Ideas**    | Places, food and things to do, grouped by city. Each has a type, must-do or nice-to-have, a maps link, notes, and a "needs booking in advance" switch that puts a to-do on the list. **Add to day** suggests the days we're in that idea's city first. |
| **To-dos**   | A checklist with optional due dates, each optionally linked to a stay, a journey or an idea. |
| **Settings** | (gear on Home) Trip name and dates, Appearance (Automatic / Light / Dark), and the cities with their colours and Japanese names. |

The rules behind it:

- **Booked stays decide the route.** A night is covered by a booked stay, or by
  an overnight journey (departs one day, arrives the next). Options never cover a
  night; once one stay is booked, other options for the same nights fade with a
  **Remove** button.
- **Cities are typed, not managed.** Typing "Kyoto" on a stay or an idea reuses
  the existing city (case-insensitively) or creates it with the next colour.
- **Changing the trip dates never loses anything.** Activities on days that fall
  off go back to Ideas; bookings outside the dates stay, marked *Outside trip dates*.
- **Dates and times are wall-clock strings** (`2027-09-29`, `10:03`), stored and
  shown exactly as entered. Nothing is converted between Israel and Japan time, so
  a ticket's printed time is what the app shows.
- **"Today" is the phone's today.** The server renders with the time zone the
  phone last reported, and the page corrects itself on the device — so at 07:00
  in Kyoto it's already the right day.
- **Works offline for reading.** Every tab is saved on the phone each time the app
  is opened with a connection. With no signal the last saved copy loads, with an
  *Offline* badge; changes need a connection.

Installs to the iPhone home screen as a standalone PWA (375–430 px first,
safe-area aware), and follows the phone's light or dark mode.

<br>

## Stack

The same as `gymApp`, on purpose:

| Piece | Choice |
| ----- | ------ |
| App | **Next.js 16 (App Router) + React 19 + TypeScript**. Server Components read, Server Actions write. |
| Styling | **Tailwind CSS v4** + **lucide-react**. iOS system colours with a vermilion accent; light mode is the same token list overridden under `prefers-color-scheme` and `[data-theme]`, as in `gal_folio`. |
| Database | **Neon Serverless Postgres** (free tier — no inactivity deletion). |
| ORM | **Prisma 7** with the `@prisma/adapter-pg` driver adapter. |
| Hosting | **Vercel Hobby** (free). |

<br>

## Deploy it for free

Total cost: **$0**. About ten minutes.

### 1 · Create the database (Neon)

1. In your existing **[Neon](https://console.neon.tech)** account, create a **new
   project** called `tabi` (region `aws-eu-central-1` is closest to Israel).
2. Hit **Connect** and copy **two** connection strings (the `.env` snippet gives
   both). Each must contain the role *and* password before the host:
   - **Pooled** — host contains `-pooler`. This is `DATABASE_URL`.
   - **Direct** — same host without `-pooler`. This is `DIRECT_URL`.

   Change `sslmode=require` to **`sslmode=verify-full`** in both.

### 2 · Create the tables

From this folder, pointed at the new database:

```bash
cp .env.example .env   # then paste the two Neon URLs into .env
npm install
npm run db:deploy      # applies prisma/migrations
```

The trip row (name and dates) is created on first load, so there's nothing to seed.

### 3 · Deploy the app (Vercel)

1. At **[vercel.com/new](https://vercel.com/new)**, import the `galmund/Tabi`
   GitHub repo. Next.js is detected; leave the build settings alone.
2. Add two **Environment Variables** (Production *and* Preview):

   | Name | Value |
   | ---- | ----- |
   | `DATABASE_URL` | the **pooled** Neon string |
   | `DIRECT_URL`   | the **direct** Neon string |

3. Deploy.

### 4 · Put it on both phones

Open the deployed URL in Safari → **Share → Add to Home Screen**. Open it once
with a connection before the flight so every tab is saved for offline.

> There's no login, by choice — anyone with the URL can see and edit the trip.
> Keep the URL between the two of you.

**Later schema changes:** edit `prisma/schema.prisma`, run
`npx prisma migrate dev --name what_changed`, commit the migration, then
`npm run db:deploy` against production.

<br>

## Run it locally

```bash
docker run -d --name tabi-db -p 5433:5432 -e POSTGRES_USER=tabi -e POSTGRES_PASSWORD=tabi -e POSTGRES_DB=tabi postgres:17-alpine
```

```bash
cp .env.example .env
# DATABASE_URL="postgresql://tabi:tabi@localhost:5433/tabi"
npm install
npm run db:deploy
npm run dev
```

Open **http://localhost:3000** in the browser's device toolbar at iPhone size.
The service worker only registers in production builds (`npm run build && npm start`).

| Script | Does |
| ------ | ---- |
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run db:migrate` | Create + apply a migration (dev) |
| `npm run db:deploy` | Apply existing migrations (prod) |
| `npm run db:studio` | Prisma Studio — browse the data |
| `npm run icons` | Regenerate the app icons |
| `npm run lint` | ESLint |

<br>

## Data model

```
Trip        name, startDate, endDate                 (one row)
City        name, nameJa, colour
  ├── Stay        BOOKED | OPTION, checkIn/out (+ times), address, bookingRef,
  │               url, price, currency, payment, cancelBy, notes
  └── Idea        kind, MUST | NICE, mapsUrl, notes, needsBooking,
                  day + time + dayOrder when it's on a day
TravelLeg   mode, origin → destination, depart/arrive date + time, carrier,
            bookingRef, seat, url, price, currency, payment, notes
Todo        title, dueDate, done — optionally linked to a Stay, TravelLeg or Idea
DayNote     day → text
```

- A to-do created by an idea's *needs booking* switch is marked `fromIdea`;
  turning the switch off removes it (unless it's already done), deleting the
  idea deletes it, and deleting the to-do turns the switch off.
- A city can't be deleted while a stay uses it; ideas just lose their city.

<br>

## Later (version 2)

Budget (yen ⇄ shekels from the prices already entered), a packing list, and
saving booking PDFs and screenshots.

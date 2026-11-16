# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two people planning and then taking one Japan trip together, 23 Sep – 26 Oct 2027. They use it as an installed iPhone home-screen app (375–430 px, safe-area aware), and just as often in a desktop browser on a Mac for longer planning sessions: entering bookings, arranging days and sorting ideas.

## Product Purpose

A private planner that answers three questions fast:

1. Where do we sleep each night, and which nights are still empty?
2. What's on today, and how do we get to the next place?
3. What do we still have to book or do before we go?

Success is opening it and getting the answer at a glance, before the trip at a desk and during the trip on a phone on a train platform.

## Positioning

Built around one specific trip and its night-by-night route, not a generic itinerary tool. Booked stays decide the route; empty nights are the thing to fix. Before the trip it is a planning desk; once the trip starts, Home turns into "today".

## Operating Context

- Before the trip: planning sessions on a Mac, quick checks and additions on the phone.
- During the trip: one-handed phone use on the move, often with poor signal; tonight's hotel, the next journey, booking numbers and map links must be reachable in a tap or two.
- Dates and times are wall-clock strings shown exactly as printed on tickets; "today" is the phone's today.
- Works offline for reading, with an Offline badge; changes need a connection.

## Capabilities and Constraints

- Tabs: Home, Days, Bookings (Stays and Travel), Ideas, To-dos (To-dos and Wish List), Settings.
- Stays: Booked or Option, check-in/out, booking number, link, address, price, currency, payment status, free-cancellation date. Options never cover a night.
- Travel: flights, shinkansen, trains, buses, ferries; overnight journeys cover a night.
- Ideas grouped by city, with type, must-do or nice-to-have, maps link, notes, "needs booking" which creates a to-do; Add to day suggests days in that city first.
- Activities can be dragged to reorder within a day; ideas can be dragged to reorder.
- Photos on stays, journeys, ideas and wishes; full-screen viewer with swipe-down to close.
- Cities are typed, not managed; each city gets its own colour, used across the route bar, tags and day strip.
- Appearance: Automatic, Light, Dark.
- Stack: Next.js 16 App Router, React 19, Tailwind CSS v4, lucide-react, Prisma/Postgres. Schemas, server actions and data flow are out of scope for visual work.

## Brand Commitments

None binding. The user confirmed the name mark, accent colour, iOS-native styling and city colour treatment may all change in a redesign. The product name is Tabi (旅).

## Evidence on Hand

Real trip data lives in the database; there is no marketing copy, testimonials or imagery. User photos are the only imagery.

## Product Principles

1. The answer before the detail: every screen leads with the fact the user opened it for.
2. Empty nights and due items are the only alarms; everything else stays calm.
3. Equal citizens: the phone on the move and the Mac at a desk both get a first-class layout.
4. Exactly as entered: times, dates and booking numbers are shown verbatim and are one tap to copy.
5. Nothing gets lost: changing dates or deleting never silently drops plans.

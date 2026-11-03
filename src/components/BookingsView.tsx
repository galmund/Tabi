"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, Plus, TrainFront } from "lucide-react";
import { deleteStay, setStayStatus } from "@/app/actions";
import { LegSheet, StaySheet, type StayDefaults } from "@/components/BookingSheets";
import { NavBar } from "@/components/NavBar";
import { LegSummary } from "@/components/rows";
import { SegmentedTrack, segmentClass } from "@/components/Segmented";
import { EmptyState, GroupedList, SectionFooter, Tag } from "@/components/ui";
import { daysBetween, formatDay, formatRange, plural } from "@/lib/dates";
import { useToday } from "@/lib/device";
import { formatMoney, PAYMENT_LABEL } from "@/lib/labels";
import { isOutsideTrip, nightsOf, overlapsBooked } from "@/lib/plan";
import type { LegRow, StayRow, TripData } from "@/lib/trip";

type Tab = "stays" | "travel";

type Editing =
  | { kind: "stay"; stay?: StayRow; defaults?: StayDefaults }
  | { kind: "leg"; leg?: LegRow }
  | null;

export function BookingsView({
  data,
  serverToday,
  initialTab,
  initialStay,
}: {
  data: TripData;
  serverToday: string;
  initialTab: Tab;
  initialStay: StayDefaults | null;
}) {
  const router = useRouter();
  const today = useToday(serverToday);
  const { trip, stays, legs, cities } = data;
  const [tab, setTab] = useState<Tab>(initialStay ? "stays" : initialTab);
  const [editing, setEditing] = useState<Editing>(
    initialStay ? { kind: "stay", defaults: initialStay } : null
  );

  const close = () => {
    setEditing(null);
    if (initialStay) router.replace("/bookings", { scroll: false });
  };

  const booked = stays.filter((stay) => stay.status === "BOOKED").length;

  return (
    <>
      <NavBar
        title="Bookings"
        eyebrow={tab === "stays" ? `${booked} booked · ${plural(stays.length - booked, "option")}` : plural(legs.length, "journey")}
        trailing={
          <button
            type="button"
            aria-label={tab === "stays" ? "Add stay" : "Add travel"}
            onClick={() => setEditing(tab === "stays" ? { kind: "stay" } : { kind: "leg" })}
            className="flex h-9 w-9 items-center justify-center rounded-full text-accent active:bg-fill"
          >
            <Plus className="h-6 w-6" strokeWidth={2.4} />
          </button>
        }
      />

      <SegmentedTrack label="Bookings" className="mb-5">
        {(["stays", "travel"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => {
              setTab(value);
              window.history.replaceState(null, "", value === "stays" ? "/bookings" : "/bookings?tab=travel");
            }}
            className={segmentClass(tab === value)}
          >
            {value === "stays" ? "Stays" : "Travel"}
          </button>
        ))}
      </SegmentedTrack>

      <div className="rise-in">
        {tab === "stays" ? (
          stays.length === 0 ? (
            <EmptyState
              icon={<BedDouble className="h-6 w-6" />}
              title="No stays yet"
              hint="Add the hotels and ryokans you book — or ones you're still deciding between as options."
            />
          ) : (
            <>
              <GroupedList inset={20}>
                {stays.map((stay) => (
                  <StayItem
                    key={stay.id}
                    stay={stay}
                    today={today}
                    outside={isOutsideTrip(trip, stay.checkIn, stay.checkOut)}
                    supersededBy={stay.status === "OPTION" ? overlapsBooked(stay, stays) : undefined}
                    onEdit={() => setEditing({ kind: "stay", stay })}
                  />
                ))}
              </GroupedList>
              <SectionFooter>
                Only booked stays count towards your nights. Options for the same nights fade once one is booked.
              </SectionFooter>
            </>
          )
        ) : legs.length === 0 ? (
          <EmptyState
            icon={<TrainFront className="h-6 w-6" />}
            title="No travel yet"
            hint="Flights, shinkansen, buses and ferries — with the times exactly as printed on the ticket."
          />
        ) : (
          <GroupedList inset={16 + 36 + 12}>
            {legs.map((leg) => (
              <li key={leg.id}>
                <button
                  type="button"
                  onClick={() => setEditing({ kind: "leg", leg })}
                  className="w-full px-4 py-3 text-left active:bg-fill"
                >
                  <LegSummary leg={leg} showDate />
                  <MetaLine
                    bookingRef={leg.bookingRef}
                    price={leg.price}
                    currency={leg.currency}
                    payment={leg.payment}
                    outside={isOutsideTrip(trip, leg.departDate, leg.arriveDate)}
                    indent
                  />
                </button>
              </li>
            ))}
          </GroupedList>
        )}
      </div>

      {editing?.kind === "stay" ? (
        <StaySheet
          key={editing.stay?.id ?? "new"}
          stay={editing.stay}
          defaults={editing.defaults}
          cities={cities}
          onDone={close}
        />
      ) : null}
      {editing?.kind === "leg" ? (
        <LegSheet key={editing.leg?.id ?? "new"} leg={editing.leg} defaultDay={trip.startDate} onDone={close} />
      ) : null}
    </>
  );
}

function MetaLine({
  bookingRef,
  price,
  currency,
  payment,
  outside,
  indent = false,
}: {
  bookingRef: string | null;
  price: number | null;
  currency: StayRow["currency"];
  payment: StayRow["payment"];
  outside: boolean;
  indent?: boolean;
}) {
  const parts = [
    price !== null && currency ? formatMoney(price, currency) : null,
    payment ? PAYMENT_LABEL[payment] : null,
    bookingRef ? `#${bookingRef}` : null,
  ].filter(Boolean);
  if (parts.length === 0 && !outside) return null;
  return (
    <div className={`mt-1.5 flex flex-wrap items-center gap-1.5 ${indent ? "pl-12" : ""}`}>
      {outside ? <Tag tone="orange">Outside trip dates</Tag> : null}
      {parts.length > 0 ? <span className="tnum text-[14px] text-dim">{parts.join(" · ")}</span> : null}
    </div>
  );
}

function StayItem({
  stay,
  today,
  outside,
  supersededBy,
  onEdit,
}: {
  stay: StayRow;
  today: string;
  outside: boolean;
  supersededBy: StayRow | undefined;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const nights = nightsOf(stay);
  const cancelIn = stay.cancelBy ? daysBetween(today, stay.cancelBy) : null;

  return (
    <li className={`${supersededBy ? "opacity-50" : ""} ${pending ? "opacity-40" : ""}`}>
      <div className="flex">
        <span className="my-3 ml-2 w-1 shrink-0 rounded-full" style={{ backgroundColor: stay.city.color }} />
        <button type="button" onClick={onEdit} className="min-w-0 flex-1 py-3 pl-3 pr-4 text-left active:bg-fill">
          <p className="flex items-center gap-2">
            <span className="truncate text-[17px] font-semibold leading-tight">{stay.name}</span>
            {stay.status === "OPTION" ? <Tag>Option</Tag> : null}
          </p>
          <p className="tnum mt-0.5 text-[14px] text-dim">
            {formatRange(stay.checkIn, stay.checkOut)} · {plural(nights, "night")} · {stay.city.name}
          </p>
          {stay.status === "BOOKED" && stay.cancelBy && cancelIn !== null ? (
            <p className={`tnum mt-0.5 text-[14px] ${cancelIn < 0 ? "text-dim" : cancelIn <= 14 ? "text-orange" : "text-dim"}`}>
              {cancelIn < 0 ? "Free cancellation has ended" : `Free cancellation until ${formatDay(stay.cancelBy)}`}
            </p>
          ) : null}
          {supersededBy ? (
            <p className="mt-0.5 text-[14px] text-dim">Overlaps {supersededBy.name}, which is booked</p>
          ) : null}
          <MetaLine
            bookingRef={stay.bookingRef}
            price={stay.price}
            currency={stay.currency}
            payment={stay.payment}
            outside={outside}
          />
        </button>
        {stay.status === "OPTION" ? (
          <div className="flex shrink-0 items-center pr-3">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await (supersededBy ? deleteStay(stay.id) : setStayStatus(stay.id, "BOOKED"));
                })
              }
              className={`pressable h-8 rounded-full px-3 text-[14px] font-semibold ${
                supersededBy ? "bg-bad/15 text-bad" : "bg-accent/15 text-accent"
              }`}
            >
              {supersededBy ? "Remove" : "Booked it"}
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

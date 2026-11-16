"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, Plus, TrainFront } from "lucide-react";
import { deleteStay, setStayStatus } from "@/app/actions";
import { LegSheet, StaySheet, type StayDefaults } from "@/components/BookingSheets";
import { EditButton, LegDetail, StayDetail } from "@/components/DetailSheets";
import { NavBar } from "@/components/NavBar";
import { CopyChip } from "@/components/quick";
import { LegSummary, Thumb } from "@/components/rows";
import { SegmentedTrack, segmentClass } from "@/components/Segmented";
import { EmptyState, GroupedList, SectionFooter, Tag } from "@/components/ui";
import { daysBetween, formatDay, formatRange, plural } from "@/lib/dates";
import { useToday } from "@/lib/device";
import { formatMoney, PAYMENT_LABEL } from "@/lib/labels";
import { isOutsideTrip, nightsOf, overlapsBooked } from "@/lib/plan";
import type { LegRow, StayRow, TripData } from "@/lib/trip";

type Tab = "stays" | "travel";

type Editing =
  | { kind: "stay"; stay?: StayRow; defaults?: StayDefaults; fromDetail?: boolean }
  | { kind: "leg"; leg?: LegRow; fromDetail?: boolean }
  | { kind: "view-stay"; id: string }
  | { kind: "view-leg"; id: string }
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

  const closeEditor = () => {
    if (editing?.kind === "stay" && editing.fromDetail && editing.stay) {
      setEditing({ kind: "view-stay", id: editing.stay.id });
    } else if (editing?.kind === "leg" && editing.fromDetail && editing.leg) {
      setEditing({ kind: "view-leg", id: editing.leg.id });
    } else {
      close();
    }
  };

  const viewingStay = editing?.kind === "view-stay" ? stays.find((stay) => stay.id === editing.id) : undefined;
  const viewingLeg = editing?.kind === "view-leg" ? legs.find((leg) => leg.id === editing.id) : undefined;

  const booked = stays.filter((stay) => stay.status === "BOOKED").length;

  return (
    <>
      <NavBar
        title="Bookings"
        subtitle={tab === "stays" ? `${booked} booked · ${plural(stays.length - booked, "option")}` : plural(legs.length, "journey")}
        trailing={
          <button
            type="button"
            aria-label={tab === "stays" ? "Add stay" : "Add travel"}
            onClick={() => setEditing(tab === "stays" ? { kind: "stay" } : { kind: "leg" })}
            className="pressable flex h-9 w-9 items-center justify-center rounded-full text-accent active:bg-fill"
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
              <GroupedList inset={16 + 40 + 12}>
                {stays.map((stay) => (
                  <StayItem
                    key={stay.id}
                    stay={stay}
                    today={today}
                    outside={isOutsideTrip(trip, stay.checkIn, stay.checkOut)}
                    supersededBy={stay.status === "OPTION" ? overlapsBooked(stay, stays) : undefined}
                    onOpen={() => setEditing({ kind: "view-stay", id: stay.id })}
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
              <li key={leg.id} className="flex items-center pr-2">
                <button
                  type="button"
                  onClick={() => setEditing({ kind: "view-leg", id: leg.id })}
                  className="min-w-0 flex-1 py-3 pl-4 pr-2 text-left active:bg-fill"
                >
                  <div className="flex items-center gap-3">
                    <LegSummary leg={leg} showDate />
                    {leg.photos[0] ? <Thumb src={leg.photos[0].src} size={44} /> : null}
                  </div>
                  <MetaLine
                    bookingRef={leg.bookingRef}
                    price={leg.price}
                    currency={leg.currency}
                    payment={leg.payment}
                    outside={isOutsideTrip(trip, leg.departDate, leg.arriveDate)}
                    indent
                  />
                </button>
                <EditButton label={`Edit ${leg.origin} to ${leg.destination}`} onClick={() => setEditing({ kind: "leg", leg })} />
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
          onDone={closeEditor}
        />
      ) : null}
      {editing?.kind === "leg" ? (
        <LegSheet key={editing.leg?.id ?? "new"} leg={editing.leg} defaultDay={trip.startDate} onDone={closeEditor} />
      ) : null}
      {viewingStay ? (
        <StayDetail
          key={viewingStay.id}
          stay={viewingStay}
          today={today}
          onEdit={() => setEditing({ kind: "stay", stay: viewingStay, fromDetail: true })}
          onDone={close}
        />
      ) : null}
      {viewingLeg ? (
        <LegDetail
          key={viewingLeg.id}
          leg={viewingLeg}
          onEdit={() => setEditing({ kind: "leg", leg: viewingLeg, fromDetail: true })}
          onDone={close}
        />
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
  ].filter(Boolean);
  if (parts.length === 0 && !outside && !bookingRef) return null;
  return (
    <div className={`mt-1.5 flex flex-wrap items-center gap-1.5 ${indent ? "pl-12" : ""}`}>
      {outside ? <Tag tone="orange">Outside trip dates</Tag> : null}
      {parts.length > 0 ? <span className="tnum text-[14px] text-dim">{parts.join(" · ")}</span> : null}
      {bookingRef ? <CopyChip value={bookingRef} prefix="#" /> : null}
    </div>
  );
}

function StayItem({
  stay,
  today,
  outside,
  supersededBy,
  onOpen,
  onEdit,
}: {
  stay: StayRow;
  today: string;
  outside: boolean;
  supersededBy: StayRow | undefined;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const nights = nightsOf(stay);
  const cancelIn = stay.cancelBy ? daysBetween(today, stay.cancelBy) : null;

  return (
    <li className={`${supersededBy ? "opacity-50" : ""} ${pending ? "opacity-40" : ""}`}>
      <div className="flex">
        <span
          aria-label={plural(nights, "night")}
          className="relative my-3 ml-4 flex h-11 w-10 shrink-0 flex-col items-center justify-center overflow-hidden rounded-[6px]"
          style={{ backgroundColor: `color-mix(in srgb, ${stay.city.color} 13%, var(--color-elev))` }}
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: stay.city.color }} />
          <span className="num text-[16px] font-bold leading-none">{nights}</span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.06em] text-dim">
            {nights === 1 ? "night" : "nights"}
          </span>
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 gap-3 py-3 pl-3 pr-2 text-left active:bg-fill"
        >
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2">
              <span className="truncate text-[17px] font-semibold leading-tight">{stay.name}</span>
              {stay.status === "OPTION" ? <Tag>Option</Tag> : null}
            </p>
            <p className="tnum mt-0.5 text-[14px] text-dim">
              {formatRange(stay.checkIn, stay.checkOut)} · {stay.city.name}
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
          </div>
          {stay.photos[0] ? <Thumb src={stay.photos[0].src} size={52} /> : null}
        </button>
        <div className="flex shrink-0 items-center gap-1 pr-2">
          {stay.status === "OPTION" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await (supersededBy ? deleteStay(stay.id) : setStayStatus(stay.id, "BOOKED"));
                })
              }
              className={`pressable h-8 rounded-full px-3 text-[14px] font-semibold ${
                supersededBy ? "bg-bad/12 text-bad hover:bg-bad/18" : "bg-accent/12 text-accent hover:bg-accent/18"
              }`}
            >
              {supersededBy ? "Remove" : "Booked it"}
            </button>
          ) : null}
          <EditButton label={`Edit ${stay.name}`} onClick={onEdit} />
        </div>
      </div>
    </li>
  );
}

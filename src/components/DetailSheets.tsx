"use client";

import type { ReactNode } from "react";
import { CalendarDays, ExternalLink, Pencil, Star, Ticket } from "lucide-react";
import { FormGroup, GroupLabel } from "@/components/form";
import { IDEA_ICON, TRAVEL_COLOR, TRAVEL_ICON } from "@/components/icons";
import { PhotoStrip } from "@/components/PhotoViewer";
import { Sheet } from "@/components/Sheet";
import { CopyChip, CopyText } from "@/components/quick";
import { CityTag, IconCircle, MapButtons, Tag } from "@/components/ui";
import { daysBetween, formatDay, plural } from "@/lib/dates";
import { formatMoney, IDEA_KIND_COLOR, IDEA_KIND_LABEL, PAYMENT_LABEL, TRAVEL_MODE_LABEL } from "@/lib/labels";
import { nightsOf } from "@/lib/plan";
import type { IdeaRow, LegRow, StayRow } from "@/lib/trip";

export function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title="Edit"
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent hover:bg-fill active:bg-fill"
    >
      <Pencil className="h-[17px] w-[17px]" />
    </button>
  );
}

function Hero({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-1">
      {icon}
      <div className="min-w-0 flex-1">
        <h2 className="text-[22px] font-bold leading-tight tracking-tight">
          <CopyText value={title}>{title}</CopyText>
        </h2>
        {children ? <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{children}</div> : null}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 px-4 py-2.5">
      <span className="shrink-0 text-[17px]">{label}</span>
      <span className="tnum min-w-0 text-right text-[17px] text-dim">{children}</span>
    </div>
  );
}

function Rows({ label, rows }: { label: string; rows: [string, ReactNode][] }) {
  const shown = rows.filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (shown.length === 0) return null;
  return (
    <div>
      <GroupLabel>{label}</GroupLabel>
      <FormGroup>
        {shown.map(([name, value]) => (
          <Row key={name} label={name}>
            {value}
          </Row>
        ))}
      </FormGroup>
    </div>
  );
}

function Notes({ text }: { text: string | null }) {
  if (!text?.trim()) return null;
  return (
    <div>
      <GroupLabel>Notes</GroupLabel>
      <p className="whitespace-pre-wrap rounded-[12px] bg-group px-4 py-3 text-[17px] leading-snug">{text}</p>
    </div>
  );
}

function Photos({ title, photos }: { title: string; photos: StayRow["photos"] }) {
  if (photos.length === 0) return null;
  return (
    <div>
      <GroupLabel>Photos</GroupLabel>
      <PhotoStrip title={title} photos={photos} size={96} />
    </div>
  );
}

function OpenLink({ href }: { href: string | null }) {
  if (!href) return null;
  let host = href;
  try {
    host = new URL(href).host.replace(/^www\./, "");
  } catch {}
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-accent">
      <span className="truncate">{host}</span>
      <ExternalLink className="h-4 w-4 shrink-0" />
    </a>
  );
}

function Copyable({ value }: { value: string }) {
  return <CopyChip value={value} />;
}

function money(item: { price: number | null; currency: StayRow["currency"] }) {
  return item.price !== null && item.currency ? formatMoney(item.price, item.currency) : null;
}

const at = (day: string | null, time: string | null) =>
  day ? [formatDay(day), time].filter(Boolean).join(" · ") : time;

export function StayDetail({
  stay,
  today,
  onEdit,
  onDone,
}: {
  stay: StayRow;
  today: string;
  onEdit: () => void;
  onDone: () => void;
}) {
  const cancelIn = stay.cancelBy ? daysBetween(today, stay.cancelBy) : null;
  return (
    <Sheet title="Stay" onDone={onDone} leading={{ label: "Edit", onClick: onEdit }}>
      {() => (
        <>
          <Hero title={stay.name}>
            <CityTag city={stay.city} />
            {stay.status === "OPTION" ? <Tag>Option</Tag> : <Tag tone="good">Booked</Tag>}
            <Tag>{plural(nightsOf(stay), "night")}</Tag>
          </Hero>

          <Photos title={stay.name} photos={stay.photos} />

          <Rows
            label="Dates · local time"
            rows={[
              ["Check-in", at(stay.checkIn, `from ${stay.checkInTime}`)],
              ["Check-out", at(stay.checkOut, `by ${stay.checkOutTime}`)],
            ]}
          />

          <Rows
            label="Booking"
            rows={[
              ["Booking no.", stay.bookingRef ? <Copyable key="ref" value={stay.bookingRef} /> : null],
              ["Link", stay.url ? <OpenLink key="url" href={stay.url} /> : null],
              [
                "Free cancel until",
                stay.cancelBy ? (
                  <span key="cancel" className={cancelIn !== null && cancelIn >= 0 && cancelIn <= 14 ? "text-orange" : ""}>
                    {formatDay(stay.cancelBy)}
                    {cancelIn !== null && cancelIn < 0 ? " · ended" : ""}
                  </span>
                ) : null,
              ],
            ]}
          />

          {stay.address ? (
            <div>
              <GroupLabel>Address</GroupLabel>
              <p className="select-text rounded-[12px] bg-group px-4 py-3 text-[17px] leading-snug">{stay.address}</p>
            </div>
          ) : null}
          <MapButtons query={stay.address ?? `${stay.name}, ${stay.city.name}, Japan`} />

          <Rows
            label="Cost"
            rows={[
              ["Price", money(stay)],
              ["Payment", stay.payment ? PAYMENT_LABEL[stay.payment] : null],
            ]}
          />

          <Notes text={stay.notes} />
        </>
      )}
    </Sheet>
  );
}

export function LegDetail({ leg, onEdit, onDone }: { leg: LegRow; onEdit: () => void; onDone: () => void }) {
  const Icon = TRAVEL_ICON[leg.mode];
  const title = `${leg.origin} → ${leg.destination}`;
  return (
    <Sheet title="Travel" onDone={onDone} leading={{ label: "Edit", onClick: onEdit }}>
      {() => (
        <>
          <Hero
            icon={
              <IconCircle color={TRAVEL_COLOR} size={44}>
                <Icon className="h-[22px] w-[22px]" />
              </IconCircle>
            }
            title={title}
          >
            <Tag>{TRAVEL_MODE_LABEL[leg.mode]}</Tag>
          </Hero>

          <Rows
            label="Times · local, as on the ticket"
            rows={[
              ["Departs", at(leg.departDate, leg.departTime)],
              ["Arrives", at(leg.arriveDate ?? (leg.arriveTime ? leg.departDate : null), leg.arriveTime)],
            ]}
          />

          <Rows
            label="Ticket"
            rows={[
              ["Carrier / no.", leg.carrier],
              ["Booking no.", leg.bookingRef ? <Copyable key="ref" value={leg.bookingRef} /> : null],
              ["Seat", leg.seat],
              ["Link", leg.url ? <OpenLink key="url" href={leg.url} /> : null],
            ]}
          />

          <Photos title={title} photos={leg.photos} />

          <Rows
            label="Cost"
            rows={[
              ["Price", money(leg)],
              ["Payment", leg.payment ? PAYMENT_LABEL[leg.payment] : null],
            ]}
          />

          <Notes text={leg.notes} />
        </>
      )}
    </Sheet>
  );
}

export function IdeaDetail({
  idea,
  onEdit,
  onMove,
  onDone,
}: {
  idea: IdeaRow;
  onEdit: () => void;
  onMove?: () => void;
  onDone: () => void;
}) {
  const Icon = IDEA_ICON[idea.kind];
  return (
    <Sheet title={idea.day ? "Activity" : "Idea"} onDone={onDone} leading={{ label: "Edit", onClick: onEdit }}>
      {() => (
        <>
          <Hero
            icon={
              <IconCircle color={IDEA_KIND_COLOR[idea.kind]} size={44}>
                <Icon className="h-[22px] w-[22px]" />
              </IconCircle>
            }
            title={idea.name}
          >
            {idea.city ? <CityTag city={idea.city} /> : null}
            <Tag>{IDEA_KIND_LABEL[idea.kind]}</Tag>
            {idea.priority === "MUST" ? (
              <Tag tone="orange">
                <Star className="h-3 w-3 fill-current" />
                Must-do
              </Tag>
            ) : null}
            {idea.needsBooking ? (
              <Tag tone="orange">
                <Ticket className="h-3 w-3" />
                Book ahead
              </Tag>
            ) : null}
          </Hero>

          <Rows
            label="Plan"
            rows={[["Day", idea.day ? at(idea.day, idea.time) : "Not on a day yet"]]}
          />

          {onMove && idea.day ? (
            <button
              type="button"
              onClick={onMove}
              className="pressable flex h-10 w-full items-center justify-center gap-1.5 rounded-[12px] bg-fill text-[15px] font-semibold text-accent"
            >
              <CalendarDays className="h-4 w-4" />
              Move to another day
            </button>
          ) : null}

          <MapButtons query={[idea.name, idea.city?.name, "Japan"].filter(Boolean).join(", ")} mapsUrl={idea.mapsUrl} />

          <Photos title={idea.name} photos={idea.photos} />

          <Notes text={idea.notes} />
        </>
      )}
    </Sheet>
  );
}

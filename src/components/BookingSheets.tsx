"use client";

import { deleteLeg, deleteStay, saveLeg, saveStay } from "@/app/actions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  ChoiceChips,
  CityField,
  InputRow,
  NotesField,
  Section,
  SelectRow,
  TextRow,
} from "@/components/form";
import { TRAVEL_ICON } from "@/components/icons";
import { PhotosField } from "@/components/PhotosField";
import { FormSheet } from "@/components/Sheet";
import { MapButtons } from "@/components/ui";
import {
  CURRENCIES,
  CURRENCY_LABEL,
  PAYMENTS,
  PAYMENT_LABEL,
  TRAVEL_MODES,
  TRAVEL_MODE_LABEL,
} from "@/lib/labels";
import type { CityRow, LegRow, StayRow } from "@/lib/trip";

const currencyOptions = CURRENCIES.map((value) => [value, CURRENCY_LABEL[value]] as const);
const paymentOptions = PAYMENTS.map((value) => [value, PAYMENT_LABEL[value]] as const);

function MoneySection({
  price,
  currency,
  payment,
}: {
  price?: number | null;
  currency?: string | null;
  payment?: string | null;
}) {
  return (
    <Section label="Cost">
      <InputRow label="Price" name="price" defaultValue={price} placeholder="0" inputMode="decimal" />
      <SelectRow label="Currency" name="currency" options={currencyOptions} defaultValue={currency ?? "JPY"} />
      <SelectRow
        label="Payment"
        name="payment"
        options={paymentOptions}
        defaultValue={payment}
        allowEmpty="Not set"
      />
    </Section>
  );
}

export type StayDefaults = { checkIn?: string; checkOut?: string; city?: string };

export function StaySheet({
  stay,
  cities,
  defaults,
  onDone,
}: {
  stay?: StayRow;
  cities: CityRow[];
  defaults?: StayDefaults;
  onDone: () => void;
}) {
  return (
    <FormSheet
      title={stay ? "Edit Stay" : "New Stay"}
      submitLabel={stay ? "Save" : "Add"}
      action={saveStay}
      onDone={onDone}
      footer={(close) =>
        stay ? <ConfirmDelete label="Delete Stay" run={() => deleteStay(stay.id)} onDeleted={close} /> : null
      }
    >
      {stay ? <input type="hidden" name="id" value={stay.id} /> : null}

      <ChoiceChips
        name="status"
        options={[
          ["BOOKED", "Booked"],
          ["OPTION", "Option"],
        ]}
        defaultValue={stay?.status ?? "BOOKED"}
      />

      <Section>
        <TextRow name="name" placeholder="Hotel or ryokan name" defaultValue={stay?.name} required maxLength={120} />
      </Section>

      <CityField cities={cities} defaultValue={stay?.city.name ?? defaults?.city} required />

      <Section label="Dates · local time">
        <InputRow label="Check-in" name="checkIn" type="date" defaultValue={stay?.checkIn ?? defaults?.checkIn} required />
        <InputRow label="From" name="checkInTime" type="time" defaultValue={stay?.checkInTime ?? "15:00"} />
        <InputRow label="Check-out" name="checkOut" type="date" defaultValue={stay?.checkOut ?? defaults?.checkOut} required />
        <InputRow label="By" name="checkOutTime" type="time" defaultValue={stay?.checkOutTime ?? "11:00"} />
      </Section>

      <Section label="Booking">
        <InputRow label="Booking no." name="bookingRef" defaultValue={stay?.bookingRef} placeholder="123456789" />
        <InputRow label="Link" name="url" type="url" defaultValue={stay?.url} placeholder="booking.com/…" />
        <InputRow label="Free cancel until" name="cancelBy" type="date" defaultValue={stay?.cancelBy} />
      </Section>

      <Section label="Address">
        <TextRow name="address" placeholder="Address, for the map buttons" defaultValue={stay?.address} maxLength={300} />
      </Section>

      {stay ? (
        <MapButtons query={stay.address ?? `${stay.name}, ${stay.city.name}, Japan`} />
      ) : null}

      <PhotosField owner="stay" ownerId={stay?.id} title={stay?.name ?? "Stay"} initial={stay?.photos ?? []} />

      <MoneySection price={stay?.price} currency={stay?.currency} payment={stay?.payment} />

      <NotesField name="notes" defaultValue={stay?.notes} placeholder="Breakfast included, room type, how to find the entrance…" />
    </FormSheet>
  );
}

export function LegSheet({
  leg,
  defaultDay,
  onDone,
}: {
  leg?: LegRow;
  defaultDay?: string;
  onDone: () => void;
}) {
  return (
    <FormSheet
      title={leg ? "Edit Travel" : "New Travel"}
      submitLabel={leg ? "Save" : "Add"}
      action={saveLeg}
      onDone={onDone}
      footer={(close) =>
        leg ? <ConfirmDelete label="Delete Travel" run={() => deleteLeg(leg.id)} onDeleted={close} /> : null
      }
    >
      {leg ? <input type="hidden" name="id" value={leg.id} /> : null}

      <ChoiceChips
        name="mode"
        options={TRAVEL_MODES.map((mode) => [mode, TRAVEL_MODE_LABEL[mode]] as const)}
        defaultValue={leg?.mode ?? "SHINKANSEN"}
        iconOf={(mode) => {
          const Icon = TRAVEL_ICON[mode];
          return <Icon className="h-4 w-4" />;
        }}
      />

      <Section>
        <TextRow name="origin" placeholder="From — Tokyo, TLV…" defaultValue={leg?.origin} required maxLength={80} />
        <TextRow name="destination" placeholder="To — Kyoto, NRT…" defaultValue={leg?.destination} required maxLength={80} />
      </Section>

      <Section label="Times · local, as on the ticket">
        <InputRow label="Departs" name="departDate" type="date" defaultValue={leg?.departDate ?? defaultDay} required />
        <InputRow label="At" name="departTime" type="time" defaultValue={leg?.departTime} />
        <InputRow label="Arrives" name="arriveDate" type="date" defaultValue={leg?.arriveDate ?? leg?.departDate} />
        <InputRow label="At" name="arriveTime" type="time" defaultValue={leg?.arriveTime} />
      </Section>

      <Section label="Ticket">
        <InputRow label="Carrier / no." name="carrier" defaultValue={leg?.carrier} placeholder="Nozomi 21" />
        <InputRow label="Booking no." name="bookingRef" defaultValue={leg?.bookingRef} placeholder="ABC123" />
        <InputRow label="Seat" name="seat" defaultValue={leg?.seat} placeholder="Car 7, 12A–B" />
        <InputRow label="Link" name="url" type="url" defaultValue={leg?.url} placeholder="smart-ex.jp/…" />
      </Section>

      <PhotosField
        owner="leg"
        ownerId={leg?.id}
        title={leg ? `${leg.origin} → ${leg.destination}` : "Travel"}
        initial={leg?.photos ?? []}
      />

      <MoneySection price={leg?.price} currency={leg?.currency} payment={leg?.payment} />

      <NotesField name="notes" defaultValue={leg?.notes} placeholder="Platform, luggage space, who has the tickets…" />
    </FormSheet>
  );
}

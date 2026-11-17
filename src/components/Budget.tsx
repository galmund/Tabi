import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Currency, Payment } from "@/generated/prisma/enums";
import { GroupedList, SectionFooter, SectionHeader } from "@/components/ui";
import { formatShortDay } from "@/lib/dates";
import { CURRENCIES, formatMoney } from "@/lib/labels";
import type { CarRow, LegRow, StayRow } from "@/lib/trip";

type Priced = {
  key: string;
  href: string;
  title: string;
  day: string;
  price: number;
  currency: Currency;
  payment: Payment | null;
};

type Totals = { currency: Currency; total: number; paid: number; deposit: number; open: number };

function pricedItems(stays: StayRow[], legs: LegRow[], cars: CarRow[]): Priced[] {
  return [
    ...stays
      .filter((stay) => stay.status === "BOOKED" && stay.price !== null && stay.currency)
      .map((stay) => ({
        key: `stay-${stay.id}`,
        href: `/bookings?stay=${stay.id}`,
        title: stay.name,
        day: stay.checkIn,
        price: stay.price!,
        currency: stay.currency!,
        payment: stay.payment,
      })),
    ...legs
      .filter((leg) => leg.price !== null && leg.currency)
      .map((leg) => ({
        key: `leg-${leg.id}`,
        href: `/bookings?leg=${leg.id}`,
        title: `${leg.origin} → ${leg.destination}`,
        day: leg.departDate,
        price: leg.price!,
        currency: leg.currency!,
        payment: leg.payment,
      })),
    ...cars
      .filter((car) => car.status === "BOOKED" && car.price !== null && car.currency)
      .map((car) => ({
        key: `car-${car.id}`,
        href: `/bookings?car=${car.id}`,
        title: `${car.company} car`,
        day: car.pickupDate,
        price: car.price!,
        currency: car.currency!,
        payment: car.payment,
      })),
  ].sort((a, b) => a.day.localeCompare(b.day));
}

function totalsOf(items: Priced[]): Totals[] {
  return CURRENCIES.map((currency) => {
    const mine = items.filter((item) => item.currency === currency);
    const sum = (payment: Payment | null) =>
      mine.filter((item) => item.payment === payment).reduce((total, item) => total + item.price, 0);
    const paid = sum("PAID");
    const deposit = sum("DEPOSIT");
    const total = mine.reduce((all, item) => all + item.price, 0);
    return { currency, total, paid, deposit, open: total - paid - deposit };
  }).filter((totals) => totals.total > 0);
}

export function BudgetSection({
  stays,
  legs,
  cars,
  className,
}: {
  stays: StayRow[];
  legs: LegRow[];
  cars: CarRow[];
  className?: string;
}) {
  const items = pricedItems(stays, legs, cars);
  if (items.length === 0) return null;
  const totals = totalsOf(items);
  const toPay = items.filter((item) => item.payment !== "PAID");

  return (
    <section className={className}>
      <SectionHeader title="Budget" trailing="Booked stays, travel & cars" />
      <div className="card space-y-4 px-4 py-4">
        {totals.map((row) => (
          <div key={row.currency}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="num text-[24px] font-bold leading-none">{formatMoney(row.total, row.currency)}</span>
              <span className="tnum text-[14px] font-medium text-dim">
                {row.open + row.deposit === 0
                  ? "All paid"
                  : row.deposit > 0
                    ? `${formatMoney(row.open + row.deposit, row.currency)} not fully paid`
                    : `${formatMoney(row.open, row.currency)} to pay`}
              </span>
            </div>
            <div
              className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-fill"
              role="img"
              aria-label={`${formatMoney(row.paid, row.currency)} paid, ${formatMoney(row.deposit, row.currency)} with a deposit, ${formatMoney(row.open, row.currency)} to pay`}
            >
              <span className="bg-good" style={{ width: `${(row.paid / row.total) * 100}%` }} />
              <span className="bg-orange" style={{ width: `${(row.deposit / row.total) * 100}%` }} />
            </div>
            <p className="tnum mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-dim">
              <Legend className="bg-good" label={`Paid ${formatMoney(row.paid, row.currency)}`} />
              {row.deposit > 0 ? <Legend className="bg-orange" label={`Deposit ${formatMoney(row.deposit, row.currency)}`} /> : null}
              {row.open > 0 ? <Legend className="bg-faint" label={`To pay ${formatMoney(row.open, row.currency)}`} /> : null}
            </p>
          </div>
        ))}
      </div>

      {toPay.length > 0 ? (
        <div className="mt-4">
          <GroupedList>
            {toPay.slice(0, 5).map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="flex items-center gap-3 px-4 py-2.5 active:bg-fill">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px]">{item.title}</span>
                    <span className="tnum block text-[13px] text-dim">
                      {formatShortDay(item.day)} · {item.payment === "DEPOSIT" ? "Deposit paid" : item.payment === "PAY_LATER" ? "Pay later" : "Payment not set"}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-[15px] font-semibold">{formatMoney(item.price, item.currency)}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
                </Link>
              </li>
            ))}
          </GroupedList>
          {toPay.length > 5 ? <SectionFooter>And {toPay.length - 5} more not fully paid.</SectionFooter> : null}
        </div>
      ) : null}
    </section>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}

"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ExternalLink, Gift, ShoppingBag } from "lucide-react";
import { deleteWish, saveWish, setWishBought } from "@/app/actions";
import { CheckButton } from "@/components/CheckButton";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { CityField, InputRow, NotesField, Section, SelectRow, TextRow } from "@/components/form";
import { PhotosField } from "@/components/PhotosField";
import { Thumb } from "@/components/rows";
import { FormSheet } from "@/components/Sheet";
import { EmptyState, GroupedList, SectionFooter, SectionHeader } from "@/components/ui";
import type { Currency } from "@/generated/prisma/enums";
import { CURRENCIES, CURRENCY_LABEL, formatMoney } from "@/lib/labels";
import type { CityRow, WishRow } from "@/lib/trip";

const currencyOptions = CURRENCIES.map((value) => [value, CURRENCY_LABEL[value]] as const);

export function wishTotals(wishes: WishRow[]): string | null {
  const sums = new Map<Currency, number>();
  for (const wish of wishes) {
    if (wish.bought || wish.price === null || !wish.currency) continue;
    sums.set(wish.currency, (sums.get(wish.currency) ?? 0) + wish.price);
  }
  if (sums.size === 0) return null;
  return [...sums].map(([currency, sum]) => formatMoney(sum, currency)).join(" + ");
}

export function WishList({ wishes, onEdit }: { wishes: WishRow[]; onEdit: (wish: WishRow) => void }) {
  const [showBought, setShowBought] = useState(false);
  const toBuy = wishes.filter((wish) => !wish.bought);
  const bought = wishes.filter((wish) => wish.bought);
  const total = wishTotals(wishes);

  if (wishes.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-6 w-6" />}
        title="Nothing on the wish list yet"
        hint="Knives in Kappabashi, Pokémon Center plushies, omiyage for the family — add what you want to bring home."
      />
    );
  }

  return (
    <div className="space-y-8">
      <section>
        {toBuy.length > 0 ? (
          <>
            <GroupedList inset={16 + 26 + 12}>
              {toBuy.map((wish) => (
                <WishItem key={wish.id} wish={wish} onEdit={() => onEdit(wish)} />
              ))}
            </GroupedList>
            {total ? <SectionFooter>About {total} still to buy, from the prices you’ve added.</SectionFooter> : null}
          </>
        ) : (
          <EmptyState icon={<Gift className="h-6 w-6" />} title="Everything’s bought" hint="Time to find space in the suitcase." />
        )}
      </section>

      {bought.length > 0 ? (
        <section>
          <SectionHeader
            title="Bought"
            trailing={
              <button type="button" onClick={() => setShowBought((value) => !value)} className="text-accent">
                {showBought ? "Hide" : `Show ${bought.length}`}
              </button>
            }
          />
          {showBought ? (
            <GroupedList inset={16 + 26 + 12}>
              {bought.map((wish) => (
                <WishItem key={wish.id} wish={wish} onEdit={() => onEdit(wish)} />
              ))}
            </GroupedList>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function WishItem({ wish, onEdit }: { wish: WishRow; onEdit: () => void }) {
  const [, startTransition] = useTransition();
  const [bought, setBought] = useOptimistic(wish.bought);
  const detail = [
    wish.forWhom ? `For ${wish.forWhom}` : null,
    wish.city?.name,
    wish.price !== null && wish.currency ? formatMoney(wish.price, wish.currency) : null,
  ].filter(Boolean);
  const cover = wish.photos[0];

  return (
    <li className="flex items-center">
      <CheckButton
        checked={bought}
        label={bought ? `Mark “${wish.name}” as not bought` : `Mark “${wish.name}” as bought`}
        onToggle={() =>
          startTransition(async () => {
            setBought(!bought);
            await setWishBought(wish.id, !bought);
          })
        }
      />
      <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-4 text-left active:bg-fill">
        <span className="min-w-0 flex-1">
          <span className={`block text-[17px] leading-tight ${bought ? "text-dim line-through" : ""}`}>{wish.name}</span>
          {detail.length > 0 ? (
            <span className="tnum mt-1 block truncate text-[14px] text-dim">{detail.join(" · ")}</span>
          ) : null}
        </span>
        {cover ? <Thumb src={cover.src} size={44} /> : null}
      </button>
    </li>
  );
}

export function WishSheet({ wish, cities, onDone }: { wish?: WishRow; cities: CityRow[]; onDone: () => void }) {
  return (
    <FormSheet
      title={wish ? "Edit Wish" : "New Wish"}
      submitLabel={wish ? "Save" : "Add"}
      action={saveWish}
      onDone={onDone}
      footer={(close) =>
        wish ? <ConfirmDelete label="Delete from Wish List" run={() => deleteWish(wish.id)} onDeleted={close} /> : null
      }
    >
      {wish ? <input type="hidden" name="id" value={wish.id} /> : null}

      <Section>
        <TextRow name="name" placeholder="Santoku knife, matcha, Totoro plush…" defaultValue={wish?.name} required maxLength={120} />
        <InputRow label="For" name="forWhom" defaultValue={wish?.forWhom} placeholder="Us, Mom, the office…" />
      </Section>

      <CityField cities={cities} defaultValue={wish?.city?.name} />

      <Section label="Roughly how much">
        <InputRow label="Price" name="price" defaultValue={wish?.price} placeholder="0" inputMode="decimal" />
        <SelectRow label="Currency" name="currency" options={currencyOptions} defaultValue={wish?.currency ?? "JPY"} />
      </Section>

      <Section label="Where to get it">
        <InputRow label="Link" name="url" type="url" defaultValue={wish?.url} placeholder="Shop or product page" />
      </Section>

      {wish?.url ? (
        <a
          href={wish.url}
          target="_blank"
          rel="noreferrer"
          className="pressable flex h-10 items-center justify-center gap-1.5 rounded-[12px] bg-fill text-[15px] font-semibold text-accent"
        >
          <ExternalLink className="h-4 w-4" />
          Open link
        </a>
      ) : null}

      <PhotosField owner="wish" ownerId={wish?.id} title={wish?.name ?? "Wish"} initial={wish?.photos ?? []} />

      <NotesField name="notes" defaultValue={wish?.notes} placeholder="Size, colour, which shop had it cheapest…" />
    </FormSheet>
  );
}

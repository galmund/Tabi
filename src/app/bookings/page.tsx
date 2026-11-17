import { BookingsView } from "@/components/BookingsView";
import { isIsoDay } from "@/lib/dates";
import { getServerToday, getTripData } from "@/lib/trip";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [data, today, params] = await Promise.all([getTripData(), getServerToday(), searchParams]);
  const from = typeof params.from === "string" && isIsoDay(params.from) ? params.from : undefined;
  const to = typeof params.to === "string" && isIsoDay(params.to) ? params.to : undefined;
  const city = typeof params.city === "string" ? params.city.slice(0, 60) : undefined;
  const stayDefaults = params.add === "stay" ? { checkIn: from, checkOut: to, city } : null;
  const view =
    typeof params.stay === "string"
      ? ({ kind: "view-stay", id: params.stay } as const)
      : typeof params.leg === "string"
        ? ({ kind: "view-leg", id: params.leg } as const)
        : null;

  return (
    <BookingsView
      key={stayDefaults ? `${from}-${to}` : view ? view.id : "list"}
      data={data}
      serverToday={today}
      initialTab={params.tab === "travel" ? "travel" : "stays"}
      initialStay={stayDefaults}
      initialView={view}
    />
  );
}

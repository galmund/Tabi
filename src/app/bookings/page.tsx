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
  const stayDefaults = params.add === "stay" ? { checkIn: from, checkOut: to } : null;

  return (
    <BookingsView
      key={stayDefaults ? `${from}-${to}` : "list"}
      data={data}
      serverToday={today}
      initialTab={params.tab === "travel" ? "travel" : "stays"}
      initialStay={stayDefaults}
    />
  );
}

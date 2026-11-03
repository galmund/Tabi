import { DaysView } from "@/components/DaysView";
import { getServerToday, getTripData } from "@/lib/trip";

export default async function DaysPage() {
  const [data, today] = await Promise.all([getTripData(), getServerToday()]);
  return <DaysView data={data} serverToday={today} />;
}

import { HomeView } from "@/components/HomeView";
import { getServerToday, getTripData } from "@/lib/trip";

export default async function HomePage() {
  const [data, today] = await Promise.all([getTripData(), getServerToday()]);
  return <HomeView data={data} serverToday={today} />;
}

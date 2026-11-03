import { TodosView } from "@/components/TodosView";
import { getServerToday, getTripData } from "@/lib/trip";

export default async function TodosPage() {
  const [data, today] = await Promise.all([getTripData(), getServerToday()]);
  return <TodosView data={data} serverToday={today} />;
}

import { TodosView } from "@/components/TodosView";
import { getServerToday, getTripData } from "@/lib/trip";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [data, today, params] = await Promise.all([getTripData(), getServerToday(), searchParams]);
  return <TodosView data={data} serverToday={today} initialList={params.list === "wish" ? "wish" : "todos"} />;
}

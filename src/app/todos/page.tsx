import { TodosView } from "@/components/TodosView";
import { getServerToday, getTripData } from "@/lib/trip";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [data, today, params] = await Promise.all([getTripData(), getServerToday(), searchParams]);
  const todoId = typeof params.todo === "string" ? params.todo : undefined;
  const wishId = typeof params.wish === "string" ? params.wish : undefined;
  return (
    <TodosView
      key={todoId ?? wishId ?? "list"}
      data={data}
      serverToday={today}
      initialList={params.list === "wish" ? "wish" : "todos"}
      initialTodoId={todoId}
      initialWishId={wishId}
    />
  );
}

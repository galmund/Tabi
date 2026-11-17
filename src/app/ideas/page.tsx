import { IdeasView } from "@/components/IdeasView";
import { getTripData } from "@/lib/trip";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [data, params] = await Promise.all([getTripData(), searchParams]);
  const ideaId = typeof params.idea === "string" ? params.idea : undefined;
  return <IdeasView key={ideaId ?? "list"} data={data} initialIdeaId={ideaId} />;
}

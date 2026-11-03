import { IdeasView } from "@/components/IdeasView";
import { getTripData } from "@/lib/trip";

export default async function IdeasPage() {
  return <IdeasView data={await getTripData()} />;
}

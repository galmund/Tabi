import { SearchView } from "@/components/SearchView";
import { getTripData } from "@/lib/trip";

export default async function SearchPage() {
  return <SearchView data={await getTripData()} />;
}

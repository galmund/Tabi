import { SettingsView } from "@/components/SettingsView";
import { getThemeChoice, getTripData } from "@/lib/trip";

export default async function SettingsPage() {
  const [data, theme] = await Promise.all([getTripData(), getThemeChoice()]);
  return <SettingsView data={data} theme={theme} />;
}

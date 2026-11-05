import type { Metadata, Viewport } from "next";
import { DeviceSync } from "@/components/DeviceSync";
import { PhotoViewerProvider } from "@/components/PhotoViewer";
import { Sidebar, TabBar } from "@/components/TabBar";
import { getThemeChoice, getTrip } from "@/lib/trip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tabi",
  description: "Our Japan trip — where we sleep, how we get there, and what we want to do.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Tabi",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};

const LIGHT_BAR = "#f2f2f7";
const DARK_BAR = "#000000";

export async function generateViewport(): Promise<Viewport> {
  const theme = await getThemeChoice();
  return {
    themeColor:
      theme === "auto"
        ? [
            { media: "(prefers-color-scheme: light)", color: LIGHT_BAR },
            { media: "(prefers-color-scheme: dark)", color: DARK_BAR },
          ]
        : theme === "light"
          ? LIGHT_BAR
          : DARK_BAR,
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, tripName] = await Promise.all([
    getThemeChoice(),
    getTrip().then(
      (trip) => trip.name,
      () => "Japan trip"
    ),
  ]);
  return (
    <html lang="en" data-theme={theme === "auto" ? undefined : theme}>
      <body className="min-h-dvh">
        <PhotoViewerProvider>
          <Sidebar tripName={tripName} />
          <div className="lg:pl-[var(--sidebar-w)]">
            <main className="mx-auto w-full max-w-lg px-4 lg:max-w-5xl lg:px-8">{children}</main>
          </div>
          <TabBar />
        </PhotoViewerProvider>
        <DeviceSync />
      </body>
    </html>
  );
}

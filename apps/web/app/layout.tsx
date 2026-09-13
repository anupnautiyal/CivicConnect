import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "CivicConnect | Community workspace",
  description: "Report local issues and follow their resolution.",
  icons: { icon: "/favicon.svg" }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip" href="#main">Skip to content</a>{children}</body></html>;
}

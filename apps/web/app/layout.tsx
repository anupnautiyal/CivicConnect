import type { Metadata } from "next";
import {DM_Sans,Space_Grotesk} from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
const bodyFont=DM_Sans({subsets:["latin"],variable:"--font-body",display:"swap"});
const headingFont=Space_Grotesk({subsets:["latin"],variable:"--font-heading",display:"swap"});
export const metadata: Metadata = {
  title: "CivicConnect | Community workspace",
  description: "Report local issues and follow their resolution.",
  icons: { icon: "/favicon.svg" }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${bodyFont.variable} ${headingFont.variable}`}><body><a className="skip" href="#main">Skip to content</a>{children}</body></html>;
}

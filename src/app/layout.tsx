import type { Metadata, Viewport } from "next";
import { Manrope, Syne } from "next/font/google";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Cursor } from "@/components/motion/Cursor";
import { GLStage } from "@/components/gl/GLStage";
import { TransitionProvider } from "@/components/gl/TransitionProvider";
import { BookingProvider } from "@/components/booking/BookingProvider";
import { Preloader } from "@/components/motion/Preloader";
import { SiteNav } from "@/components/nav/SiteNav";
import { Footer } from "@/components/nav/Footer";
import "./globals.css";

const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["600", "700", "800"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const SITE_URL = "https://k3sra.github.io/travelagency";

export const metadata: Metadata = {
  title: { default: "FABLE — The best week of your year", template: "%s — FABLE" },
  description: "Hosted group weeks in Bali, Thailand, Cape Town and Rio. Twelve people, one villa, boat days, beach clubs and the nights in between.",
  metadataBase: new URL(SITE_URL),
  openGraph: { siteName: "FABLE", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${syne.variable} ${manrope.variable}`}>
      <body data-custom-cursor="on">
        <SmoothScroll>
          <TransitionProvider>
            <BookingProvider>
              <Preloader />
              <SiteNav />
              {children}
              <Footer />
            </BookingProvider>
          </TransitionProvider>
        </SmoothScroll>
        <GLStage />
        <Cursor />
      </body>
    </html>
  );
}

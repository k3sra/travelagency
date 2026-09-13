import type { Metadata, Viewport } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Cursor } from "@/components/motion/Cursor";
import { GLStage } from "@/components/gl/GLStage";
import { TransitionProvider } from "@/components/gl/TransitionProvider";
import { BookingProvider } from "@/components/booking/BookingProvider";
import { Preloader } from "@/components/motion/Preloader";
import { SiteNav } from "@/components/nav/SiteNav";
import { Footer } from "@/components/nav/Footer";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["600", "700", "800"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const SITE_URL = "https://k3sra.github.io/travelagency";

export const metadata: Metadata = {
  title: { default: "FABLE · Hosted group trips for 25 to 40 year olds", template: "%s · FABLE" },
  description: "Hosted group weeks in Bali, Thailand, Cape Town and Rio for solo travellers and small groups aged 25 to 40. Twelve travellers, one villa, one host, all-in pricing, free cancellation for 14 days.",
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
    <html lang="en" className={`${jakarta.variable} ${manrope.variable}`}>
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

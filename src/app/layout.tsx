import type { Metadata, Viewport } from "next";
import { Cinzel, Crimson_Text, Playfair_Display } from "next/font/google";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Cursor } from "@/components/motion/Cursor";
import { GLStage } from "@/components/gl/GLStage";
import { TransitionProvider } from "@/components/gl/TransitionProvider";
import { BookingProvider } from "@/components/booking/BookingProvider";
import { SiteNav } from "@/components/nav/SiteNav";
import { Footer } from "@/components/nav/Footer";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const crimson = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_URL = "https://k3sra.github.io/travelagency";

export const metadata: Metadata = {
  title: {
    default: "Fable Travels — Write your own legend.",
    template: "%s — Fable Travels",
  },
  description:
    "Small-group journeys for grown-ups who travel slowly. Kyoto, Patagonia, the Sahara, Iceland. Ten travellers, one host, no itinerary you have seen before.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: "Fable Travels",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2D3A3A",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${cinzel.variable} ${crimson.variable}`}>
      <body>
        <SmoothScroll>
          <TransitionProvider>
            <BookingProvider>
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

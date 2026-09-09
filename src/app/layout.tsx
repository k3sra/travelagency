import type { Metadata, Viewport } from "next";
import { Cinzel, Crimson_Text, Playfair_Display } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Fable Travels — Write your own legend.",
    template: "%s — Fable Travels",
  },
  description:
    "Small-group journeys for grown-ups who travel slowly. Kyoto, Patagonia, the Sahara, Iceland. Ten travellers, one host, no itinerary you have seen before.",
  metadataBase: new URL("https://fabletravels.com"),
  openGraph: {
    siteName: "Fable Travels",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2D3A3A",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${cinzel.variable} ${crimson.variable}`}>
      <body>{children}</body>
    </html>
  );
}

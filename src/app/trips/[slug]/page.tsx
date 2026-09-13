import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TripHero } from "@/components/trip/TripHero";
import { Itinerary } from "@/components/trip/Itinerary";
import { Group } from "@/components/trip/Group";
import { Details } from "@/components/trip/Details";
import { BookBar } from "@/components/trip/BookBar";
import { getTrip, getTrips } from "@/lib/journeys";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTrips().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/trips/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const trip = getTrip(slug);
  if (!trip) return {};
  return {
    title: trip.title,
    description: trip.subtitle,
    openGraph: { images: [{ url: trip.hero.src, width: trip.hero.width, height: trip.hero.height, alt: trip.hero.alt }] },
  };
}

export default async function TripPage({ params }: PageProps<"/trips/[slug]">) {
  const { slug } = await params;
  const trip = getTrip(slug);
  if (!trip) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: trip.title,
    description: trip.subtitle,
    touristType: "Small group",
    itinerary: trip.chapters.map((c) => ({ "@type": "TouristAttraction", name: c.title })),
    offers: { "@type": "Offer", price: trip.price.amount, priceCurrency: trip.price.currency, availability: trip.spotsRemaining > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut" },
  };
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TripHero trip={trip} />
      <Itinerary trip={trip} />
      <Group trip={trip} />
      <Details trip={trip} />
      <BookBar trip={trip} />
    </main>
  );
}

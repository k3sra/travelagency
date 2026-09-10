import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TransitionLink } from "@/components/gl/TransitionLink";
import { Chapters } from "@/components/journey/Chapters";
import { Collective } from "@/components/journey/Collective";
import { Curator } from "@/components/journey/Curator";
import { Inclusions } from "@/components/journey/Inclusions";
import { JourneyTitle } from "@/components/journey/JourneyCard";
import { JourneyHeader } from "@/components/journey/JourneyHeader";
import { SecureSpot } from "@/components/journey/SecureSpot";
import { ShutterImage } from "@/components/motion/ShutterImage";
import { TextReveal } from "@/components/motion/TextReveal";
import { getJourney, getJourneys } from "@/lib/journeys";
import type { Journey } from "@/lib/types";
import styles from "./page.module.css";

type Props = PageProps<"/journeys/[slug]">;

/** Build date, ISO: the day this offer was published. */
const PUBLISHED = new Date().toISOString().slice(0, 10);

export function generateStaticParams() {
  return getJourneys().map((journey) => ({ slug: journey.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const journey = getJourney(slug);
  if (!journey) return { title: "Not on the map" };

  return {
    title: journey.title,
    description: journey.subtitle,
    openGraph: {
      title: journey.title,
      description: journey.subtitle,
      type: "website",
      images: [
        {
          url: journey.hero.src,
          width: journey.hero.width,
          height: journey.hero.height,
          alt: journey.hero.alt,
        },
      ],
    },
  };
}

function structuredData(journey: Journey) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: journey.title,
    description: journey.subtitle,
    image: journey.hero.src,
    touristType: journey.vibe.map((v) => v.label),
    provider: { "@type": "Organization", name: "Fable Travels" },
    itinerary: {
      "@type": "ItemList",
      numberOfItems: journey.chapters.length,
      itemListElement: journey.chapters.map((chapter, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: chapter.title,
        description: chapter.body,
      })),
    },
    offers: {
      "@type": "Offer",
      url: `/journeys/${journey.slug}`,
      price: journey.price.amount,
      priceCurrency: journey.price.currency,
      availability:
        journey.spotsRemaining > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      validFrom: PUBLISHED,
      validThrough: journey.startDate,
      inventoryLevel: { "@type": "QuantitativeValue", value: journey.spotsRemaining },
    },
  };
}

export default async function JourneyPage({ params }: Props) {
  const { slug } = await params;
  const journey = getJourney(slug);
  if (!journey) notFound();

  const catalogue = getJourneys();
  const at = catalogue.findIndex((j) => j.slug === journey.slug);
  const next = catalogue[(at + 1) % catalogue.length];
  const jsonLd = JSON.stringify(structuredData(journey)).replace(/</g, "\\u003c");

  return (
    <main className={styles.main}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <JourneyHeader journey={journey} />

      <section className={styles.promise} aria-label="The promise">
        <div className={`container ${styles.promiseGrid}`}>
          <TextReveal as="p" className={`t-display ${styles.promiseText}`}>
            {journey.promise}
          </TextReveal>
          <Curator curator={journey.curator} className={styles.curator} />
        </div>
      </section>

      <Chapters chapters={journey.chapters} durationDays={journey.durationDays} />

      <Collective journey={journey} />

      <Inclusions journey={journey} />

      <section className={`container ${styles.next}`} aria-labelledby="next-title">
        <p className="t-caps t-muted">Next departure</p>
        <TransitionLink
          href={`/journeys/${next.slug}`}
          kind={next.transition}
          to={next.hero.src}
          className={styles.nextLink}
          data-cursor="view"
          data-cursor-label="View journey"
        >
          <ShutterImage
            image={next.hero}
            ratio="var(--next-ratio)"
            sizes="100vw"
            parallax={0.1}
            plate="vellum"
          />
          <span className={styles.nextCopy}>
            <TextReveal as="h2" id="next-title" className={`t-display ${styles.nextTitle}`}>
              <JourneyTitle title={next.title} titleEm={next.titleEm} />
            </TextReveal>
            <span className={`t-caps t-muted ${styles.nextMeta}`}>
              {next.country} · {next.season} · {next.dates}
            </span>
          </span>
        </TransitionLink>
      </section>

      <SecureSpot journey={journey} />
    </main>
  );
}

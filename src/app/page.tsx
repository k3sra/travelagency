import { Hero } from "@/components/home/Hero";
import { Manifesto } from "@/components/home/Manifesto";
import { Destinations } from "@/components/home/Destinations";
import { JourneyIndex } from "@/components/home/JourneyIndex";
import { CollectiveTeaser } from "@/components/home/CollectiveTeaser";
import { Closing } from "@/components/home/Closing";

const organisation = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Fable Travels",
  slogan: "Write your own legend.",
  description:
    "Small-group journeys for grown-ups who travel slowly. Ten travellers, one host, four departures a year.",
  url: "https://k3sra.github.io/travelagency/",
};

export default function Home() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }} />
      <Hero />
      <Manifesto />
      <Destinations />
      <JourneyIndex />
      <CollectiveTeaser />
      <Closing />
    </main>
  );
}

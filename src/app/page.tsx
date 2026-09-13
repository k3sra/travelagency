import { Hero } from "@/components/home/Hero";
import { Manifesto } from "@/components/home/Manifesto";
import { Reel } from "@/components/home/Reel";
import { Kinetic } from "@/components/home/Kinetic";
import { Moments } from "@/components/home/Moments";
import { Destinations } from "@/components/home/Destinations";
import { JourneyIndex } from "@/components/home/JourneyIndex";
import { CollectiveTeaser } from "@/components/home/CollectiveTeaser";
import { StraightAnswers } from "@/components/home/StraightAnswers";
import { Closing } from "@/components/home/Closing";

const organisation = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Fable Travels",
  slogan: "Write your own legend.",
  description:
    "Hosted small-group weeks for people who do not do tours. Ten travellers, one host, villas, boats and deserts, four departures a year.",
  url: "https://k3sra.github.io/travelagency/",
};

export default function Home() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }} />
      <Hero />
      <Manifesto />
      <Reel />
      <Moments />
      <Kinetic />
      <Destinations />
      <JourneyIndex />
      <CollectiveTeaser />
      <StraightAnswers />
      <Closing />
    </main>
  );
}

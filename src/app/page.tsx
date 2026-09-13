import { Hero } from "@/components/home/Hero";
import { Hook } from "@/components/home/Hook";
import { TripsRail } from "@/components/home/TripsRail";
import { Wall } from "@/components/home/Wall";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Faces } from "@/components/home/Faces";
import { Reel } from "@/components/home/Reel";
import { Closing } from "@/components/home/Closing";

const organisation = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "FABLE",
  description: "Hosted group weeks in Bali, Thailand, Cape Town and Rio. Twelve people, one villa, boat days, beach clubs and the nights in between.",
  url: "https://k3sra.github.io/travelagency/",
};

export default function Home() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }} />
      <Hero />
      <Hook />
      <TripsRail />
      <Wall />
      <HowItWorks />
      <Faces />
      <Reel />
      <Closing />
    </main>
  );
}

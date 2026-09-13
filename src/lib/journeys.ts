import { curatorPortrait, image, portrait } from "./media";
import type { Journey, Traveller } from "./types";

/**
 * Four hosted weeks. Copy is deliberately short: one hook per trip, one line
 * per day. The pictures carry the rest.
 */

const pool = (...rows: [number, string, string, number, string?][]): Traveller[] =>
  rows.map(([n, firstName, from, match, note]) => ({ id: `p${n}`, firstName, from, portrait: portrait(n), match, note }));

const ch = (slug: string, n: number, alt: string) => image(`trips/${slug}/chapter-0${n}.jpg`, alt);
const heroes = (slug: string, alt: string) => ({
  hero: image(`trips/${slug}/hero.jpg`, alt),
  heroTall: image(`trips/${slug}/hero-tall.jpg`, alt, 1250, 2000),
  card: image(`trips/${slug}/card.jpg`, alt, 1400, 1750),
});

export const journeys: Journey[] = [
  {
    slug: "bali",
    title: "Bali",
    subtitle: "Cliff villa. Boat day. Nights that run late.",
    region: "Uluwatu · Canggu · Ubud",
    country: "Indonesia",
    season: "Dry season",
    dates: "14 – 21 Jun 2026",
    startDate: "2026-06-14",
    durationDays: 8,
    groupMax: 12,
    spotsRemaining: 2,
    intent: "Best first week",
    price: { amount: 2490, currency: "USD", deposit: 400 },
    vibe: [
      { label: "Pool", pct: 92 },
      { label: "Party", pct: 78 },
      { label: "Jungle", pct: 55 },
    ],
    ...heroes("bali", "Friends in the villa pool at golden hour"),
    transition: "dissolve",
    promise: "One villa on the cliff, twelve of you, a driver who knows what is open at 2am.",
    chapters: [
      { numeral: "01", days: "Day 1", title: "The cliff villa", body: "Land, drop the bags, straight into the pool. Long table. First names.", image: ch("bali", 1, "The villa pool at night, everyone in it") },
      { numeral: "02", days: "Day 3", title: "Boat day", body: "Nusa Penida by wooden boat. Jump off the roof. Fish on the deck.", image: ch("bali", 2, "Jumping off the boat") },
      { numeral: "03", days: "Day 4", title: "Canggu on scooters", body: "Surf in the morning. Beach club by three. The night writes itself.", image: ch("bali", 3, "Scooters at sunset") },
      { numeral: "04", days: "Day 6", title: "The jungle", body: "Rafting, then a villa above the valley with a pool that faces the light.", image: ch("bali", 4, "Rafting through the jungle") },
      { numeral: "05", days: "Day 8", title: "Last sunset", body: "One more beach club. Numbers swapped. Nobody wants the car.", image: ch("bali", 5, "Beach club at sunset") },
    ],
    travellers: pool([1, "Amara", "London", 94], [2, "Tomas", "Lisbon", 91], [3, "Priya", "Berlin", 88], [4, "Leonie", "Zürich", 87], [5, "Marcus", "Chicago", 85], [6, "Ingrid", "Oslo", 83], [7, "Kenji", "Melbourne", 82], [8, "Sofia", "Buenos Aires", 79], [9, "Dev", "Toronto", 78], [10, "Chloé", "Lyon", 76]),
    curator: { name: "Nadia", role: "Your host · ran a beach bar in Canggu for six years", bio: "Knows every boat captain by first name, and which one waits for the late sleepers.", portrait: curatorPortrait(1) },
    inclusions: ["7 nights, 3 villas", "Private boat day", "Every meal and drink at the table", "Airport transfers and a driver all week", "Twelve people. Never more."],
  },
  {
    slug: "thailand",
    title: "Thailand",
    subtitle: "Bangkok rooftops, then islands that glow at night.",
    region: "Bangkok · Phi Phi · Phuket",
    country: "Thailand",
    season: "High season",
    dates: "8 – 15 Nov 2026",
    startDate: "2026-11-08",
    durationDays: 8,
    groupMax: 12,
    spotsRemaining: 1,
    intent: "Loudest nights",
    price: { amount: 2290, currency: "USD", deposit: 400 },
    vibe: [
      { label: "Party", pct: 95 },
      { label: "Boat", pct: 84 },
      { label: "Pool", pct: 70 },
    ],
    ...heroes("thailand", "Friends on a longtail boat in turquoise water"),
    transition: "ripple",
    promise: "Two nights in the city, five on the water. Sleep is optional.",
    chapters: [
      { numeral: "01", days: "Day 1", title: "Bangkok, up high", body: "A rooftop above the river. Street food after. A tuk tuk race home.", image: ch("thailand", 1, "Rooftop bar in Bangkok at night") },
      { numeral: "02", days: "Day 3", title: "Longtail day", body: "Phi Phi by longtail. Snorkel, jump, repeat. Lunch on a sandbar.", image: ch("thailand", 2, "Longtail boat in turquoise water") },
      { numeral: "03", days: "Day 4", title: "Fire on the beach", body: "The beach party everyone has heard about, with the table already booked.", image: ch("thailand", 3, "Beach party with fire show") },
      { numeral: "04", days: "Day 6", title: "Kayaks and lagoons", body: "Paddle into a lagoon you cannot see from the sea. Silence, then not.", image: ch("thailand", 4, "Kayaking in a lagoon") },
      { numeral: "05", days: "Day 8", title: "Sunset, last one", body: "Feet in the sand. One long dinner. The group chat is already planning.", image: ch("thailand", 5, "Sunset drinks on the beach") },
    ],
    travellers: pool([9, "Dev", "Toronto", 92], [3, "Priya", "Berlin", 90], [11, "Yara", "Paris", 89], [12, "Luca", "Milan", 86], [5, "Marcus", "Chicago", 84], [13, "Hugo", "Copenhagen", 83], [14, "Nour", "Dubai", 81], [6, "Ingrid", "Oslo", 79], [15, "Jonah", "Tel Aviv", 78], [16, "Wren", "Portland", 77]),
    curator: { name: "Ploy", role: "Your host · Bangkok born, ten seasons on the islands", bio: "Has never queued for a boat and does not plan to start with you.", portrait: curatorPortrait(2) },
    inclusions: ["7 nights, city hotel and beach villa", "Private longtail day", "Every meal and drink at the table, two nights with the table booked", "Flights between city and islands", "Twelve people. Never more."],
  },
  {
    slug: "cape-town",
    title: "Cape Town",
    subtitle: "A mountain, two oceans and a lunch that will not end.",
    region: "Camps Bay · Winelands · Cape Point",
    country: "South Africa",
    season: "Late summer",
    dates: "20 – 27 Feb 2027",
    startDate: "2027-02-20",
    durationDays: 8,
    groupMax: 12,
    spotsRemaining: 5,
    intent: "Biggest days out",
    price: { amount: 2690, currency: "USD", deposit: 450 },
    vibe: [
      { label: "Big days", pct: 88 },
      { label: "Long lunches", pct: 90 },
      { label: "Party", pct: 64 },
    ],
    ...heroes("cape-town", "Friends at the summit with the ocean behind"),
    transition: "ripple",
    promise: "A villa on the beach with the mountain behind it. Some of the best days of your year, back to back.",
    chapters: [
      { numeral: "01", days: "Day 1", title: "Camps Bay", body: "The villa faces the sunset. Braai on the terrace. It goes late.", image: ch("cape-town", 1, "Sunset drinks on the terrace") },
      { numeral: "02", days: "Day 3", title: "Up the mountain", body: "Table Mountain on foot before the heat. Clifton to cool down.", image: ch("cape-town", 2, "At the summit, arms up") },
      { numeral: "03", days: "Day 4", title: "The winelands", body: "One long lunch in Franschhoek. Somebody buys too much wine.", image: ch("cape-town", 3, "Long lunch in the vineyards") },
      { numeral: "04", days: "Day 6", title: "Two oceans", body: "Chapman's Peak, penguins, the Cape, then a catamaran into the sunset.", image: ch("cape-town", 4, "Catamaran at sunset") },
      { numeral: "05", days: "Day 8", title: "The last big night", body: "Someone has a birthday. There is usually someone. The beach after.", image: ch("cape-town", 5, "Beach party at sunset") },
    ],
    travellers: pool([13, "Hugo", "Copenhagen", 91], [2, "Tomas", "Lisbon", 87], [16, "Wren", "Portland", 86], [8, "Sofia", "Buenos Aires", 80], [11, "Yara", "Paris", 78], [4, "Leonie", "Zürich", 77], [9, "Dev", "Toronto", 75]),
    curator: { name: "Thandi", role: "Your host · Capetonian, mountain guide, best braai on the Atlantic", bio: "One rule: nobody leaves without a day they will talk about for a decade.", portrait: curatorPortrait(4) },
    inclusions: ["7 nights in one villa in Camps Bay", "Guided hike, winelands day, sunset catamaran", "Every meal and drink at the table", "Airport transfers and a minibus all week", "Twelve people. Never more."],
  },
  {
    slug: "rio",
    title: "Rio",
    subtitle: "Beach by day. The whole city by night.",
    region: "Ipanema · Santa Teresa · Búzios",
    country: "Brazil",
    season: "Summer",
    dates: "23 – 30 Jan 2027",
    startDate: "2027-01-23",
    durationDays: 8,
    groupMax: 12,
    spotsRemaining: 4,
    intent: "Best for solo",
    price: { amount: 2590, currency: "USD", deposit: 450 },
    vibe: [
      { label: "Party", pct: 90 },
      { label: "Beach", pct: 86 },
      { label: "Big days", pct: 60 },
    ],
    ...heroes("rio", "Friends on Ipanema beach at sunset"),
    transition: "stretch",
    promise: "Half the group arrives alone. By the second night nobody remembers who came with whom.",
    chapters: [
      { numeral: "01", days: "Day 1", title: "Rooftop pool", body: "A house in Santa Teresa with the city underneath. First caipirinha at the pool.", image: ch("rio", 1, "Rooftop pool over the city") },
      { numeral: "02", days: "Day 2", title: "Ipanema", body: "Beach volleyball you will lose. A vendor who knows your name by noon.", image: ch("rio", 2, "Beach volleyball at sunset") },
      { numeral: "03", days: "Day 3", title: "Samba, properly", body: "A street party in Lapa. Dancing badly is the point.", image: ch("rio", 3, "Dancing at a street party") },
      { numeral: "04", days: "Day 5", title: "Above the city", body: "Sugarloaf on foot, the view at the top, the swim after.", image: ch("rio", 4, "Viewpoint above the city and ocean") },
      { numeral: "05", days: "Day 7", title: "Búzios by boat", body: "Two nights on the coast. A boat, a bay, a sunset nobody talks through.", image: ch("rio", 5, "Boat party at sunset in the bay") },
    ],
    travellers: pool([16, "Wren", "Portland", 93], [12, "Luca", "Milan", 88], [1, "Amara", "London", 86], [14, "Nour", "Dubai", 85], [7, "Kenji", "Melbourne", 82], [10, "Chloé", "Lyon", 80], [15, "Jonah", "Tel Aviv", 79], [8, "Sofia", "Buenos Aires", 77]),
    curator: { name: "Mateus", role: "Your host · carioca, former lifeguard, knows every bloco", bio: "Has never missed a sunset at Arpoador and will not let you either.", portrait: curatorPortrait(3) },
    inclusions: ["7 nights, city house and beach pousada", "Boat day in Búzios", "Every meal and drink at the table, one night with the table booked", "Airport transfers and a driver all week", "Twelve people. Never more."],
  },
];

export const getJourneys = () => journeys;
export const getTrips = getJourneys;
export const getJourney = (slug: string) => journeys.find((j) => j.slug === slug);
export const getTrip = getJourney;

export const formatPrice = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

export const featuredSlugs = ["bali", "thailand", "cape-town", "rio"];

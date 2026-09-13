import { curatorPortrait, image, portrait } from "./media";
import type { Journey, Traveller } from "./types";

/**
 * Journey catalogue. Four hosted villa weeks, each a complete package the
 * pages render from. Copy is written to be read fast on a phone at midnight:
 * short lines, concrete moments, people before places.
 */

const pool = (
  ...rows: [number, string, string, number, string?][]
): Traveller[] =>
  rows.map(([n, firstName, from, match, note]) => ({
    id: `p${n}`,
    firstName,
    from,
    portrait: portrait(n),
    match,
    note,
  }));

const ch = (slug: string, n: number, alt: string) => image(`journeys/${slug}/chapter-0${n}.jpg`, alt);

export const journeys: Journey[] = [
  {
    slug: "bali-in-full-colour",
    title: "Bali, in Full Colour",
    titleEm: "Full Colour",
    subtitle: "Eight days between a cliff villa, a jungle pool and a boat that leaves when everyone is on it.",
    region: "Uluwatu · Canggu · Ubud",
    country: "Bali",
    season: "Dry season",
    dates: "14 – 21 Jun 2026",
    startDate: "2026-06-14",
    durationDays: 8,
    groupMax: 12,
    spotsRemaining: 2,
    intent: "Best first Fable",
    price: { amount: 3900, currency: "USD", deposit: 500 },
    vibe: [
      { label: "Pool Days", pct: 92 },
      { label: "After Dark", pct: 74 },
      { label: "Jungle", pct: 51 },
    ],
    hero: image("journeys/bali-in-full-colour/hero.jpg", "Friends jumping off the boat into blue water"),
    heroTall: image("journeys/bali-in-full-colour/hero-tall.jpg", "Friends jumping off the boat into blue water", 1250, 2000),
    card: image("journeys/bali-in-full-colour/card.jpg", "The villa pool at golden hour, everyone in it", 1400, 1750),
    transition: "dissolve",
    promise:
      "One villa on the cliff, twelve people, and a driver called Wayan who knows which warung is open at 2am. You will not see a name badge all week.",
    chapters: [
      { numeral: "I", days: "Days 1–2", title: "The cliff villa", body: "Cars from the airport straight to Uluwatu. The pool hangs over the ocean and the first night is just that: the pool, a long table, and finding out who everyone is.", image: ch("bali-in-full-colour", 1, "The villa pool at dusk with everyone in it") },
      { numeral: "II", days: "Day 3", title: "Boat day", body: "A wooden boat to Nusa Penida. You will jump off the roof at least once. Grilled fish on the deck, a snorkel with mantas if they turn up, and a slow ride back into the sunset.", image: ch("bali-in-full-colour", 2, "Friends jumping off the boat") },
      { numeral: "III", days: "Days 4–5", title: "Canggu, on scooters", body: "Two nights in a surf town. Board hire in the morning, a beach club by three, and the evening is whatever the group chat decides. Nobody sets an alarm.", image: ch("bali-in-full-colour", 3, "Friends on scooters at sunset") },
      { numeral: "IV", days: "Days 6–7", title: "Up into the jungle", body: "A second villa above Ubud with a pool that faces the valley. A rafting run in the morning, a rice-terrace walk in the late light, and dinner cooked at the house.", image: ch("bali-in-full-colour", 4, "Rafting through the jungle") },
      { numeral: "V", days: "Day 8", title: "The last sunset", body: "Back to the coast for one final beach club, feet in the sand, phone numbers already swapped. Cars to the airport whenever your flight is.", image: ch("bali-in-full-colour", 5, "Beach club at sunset, friends dancing") },
    ],
    travellers: pool(
      [1, "Amara", "Lagos → London", 94, "Second Fable."],
      [2, "Tomas", "Lisbon", 91],
      [3, "Priya", "Mumbai → Berlin", 88],
      [4, "Leonie", "Zürich", 87, "Brings the speaker."],
      [5, "Marcus", "Chicago", 85],
      [6, "Ingrid", "Oslo", 83],
      [7, "Kenji", "Osaka → Melbourne", 82],
      [8, "Sofia", "Buenos Aires", 79],
      [9, "Dev", "Toronto", 78],
      [10, "Chloé", "Lyon", 76],
    ),
    curator: {
      name: "Nadia Reyes",
      role: "Your host · ran a beach bar in Canggu for six years",
      bio: "Nadia knows every boat captain between Sanur and Penida by first name, and which one will wait for the late sleepers.",
      portrait: curatorPortrait(1),
    },
    inclusions: [
      "Seven nights: cliff villa, surf-town house, jungle villa",
      "Private boat day to Nusa Penida with lunch on deck",
      "Every meal and every drink at the table",
      "Airport transfers and a driver on call all week",
      "A group of twelve. Never more.",
    ],
  },
  {
    slug: "mykonos-after-dark",
    title: "Mykonos, After Dark",
    titleEm: "After Dark",
    subtitle: "Seven days on the island that never asked what time it was.",
    region: "Cyclades",
    country: "Greece",
    season: "High summer",
    dates: "5 – 12 Jul 2026",
    startDate: "2026-07-05",
    durationDays: 7,
    groupMax: 12,
    spotsRemaining: 1,
    intent: "Most after-dark",
    price: { amount: 4600, currency: "USD", deposit: 600 },
    vibe: [
      { label: "After Dark", pct: 95 },
      { label: "Boat Days", pct: 80 },
      { label: "Slow Mornings", pct: 88 },
    ],
    hero: image("journeys/mykonos-after-dark/hero.jpg", "Friends on the deck of a yacht, laughing"),
    heroTall: image("journeys/mykonos-after-dark/hero-tall.jpg", "Friends on the deck of a yacht, laughing", 1250, 2000),
    card: image("journeys/mykonos-after-dark/card.jpg", "Sunset drinks by the white villa pool", 1400, 1750),
    transition: "ripple",
    promise:
      "A white villa above the sea, a yacht with its own DJ, and a host who gets you past the rope. Sleep is a daytime activity.",
    chapters: [
      { numeral: "I", days: "Days 1–2", title: "The white villa", body: "Twelve rooms around one pool, the Aegean underneath. First night is dinner at the house and a first drink at Little Venice when the sun goes into the sea.", image: ch("mykonos-after-dark", 1, "Sunset drinks by the pool") },
      { numeral: "II", days: "Day 3", title: "The yacht", body: "Out at eleven, back when the light goes. Rhenia for the swim, Delos for the ruins if you want them, a speaker on the deck either way.", image: ch("mykonos-after-dark", 2, "Friends jumping off the yacht") },
      { numeral: "III", days: "Day 4", title: "The island loop", body: "Quad bikes to the far beaches nobody drives to, a taverna lunch that lasts until four, and a nap you will need.", image: ch("mykonos-after-dark", 3, "Quad bikes on a dirt road to the beach") },
      { numeral: "IV", days: "Days 5–6", title: "Beach club, then the club", body: "A daybed at Scorpios or Principote, then the night proper. Your host has the table. You have the morning off.", image: ch("mykonos-after-dark", 4, "Friends dancing at a beach club at sunset") },
      { numeral: "V", days: "Day 7", title: "The slow goodbye", body: "Breakfast at noon, one last swim, and a group photo nobody is ready for. Transfers to the port or the airport whenever you like.", image: ch("mykonos-after-dark", 5, "Friends at breakfast by the pool") },
    ],
    travellers: pool(
      [9, "Dev", "Toronto", 92],
      [3, "Priya", "Mumbai → Berlin", 90],
      [11, "Yara", "Beirut → Paris", 89, "Third Fable."],
      [12, "Luca", "Milan", 86],
      [5, "Marcus", "Chicago", 84],
      [13, "Hugo", "Copenhagen", 83],
      [14, "Nour", "Dubai", 81],
      [6, "Ingrid", "Oslo", 79],
      [15, "Jonah", "Tel Aviv", 78],
      [16, "Wren", "Portland", 77],
      [2, "Tomas", "Lisbon", 75],
    ),
    curator: {
      name: "Elena Vasilaki",
      role: "Your host · Mykonos born, ten summers on the door at Scorpios",
      bio: "Elena has never queued on the island and does not intend to start with you.",
      portrait: curatorPortrait(2),
    },
    inclusions: [
      "Six nights in one villa above the sea",
      "Private yacht day with skipper, lunch and a very good speaker",
      "Every meal and every drink at the table, two club nights with the table booked",
      "Quad bikes, airport and port transfers",
      "A group of twelve. Never more.",
    ],
  },
  {
    slug: "tulum-slow-heat",
    title: "Tulum, Slow Heat",
    titleEm: "Slow Heat",
    subtitle: "Seven days of cenotes, jungle villas and dinners that start when the candles do.",
    region: "Riviera Maya",
    country: "Mexico",
    season: "Winter sun",
    dates: "17 – 24 Jan 2027",
    startDate: "2027-01-17",
    durationDays: 7,
    groupMax: 12,
    spotsRemaining: 4,
    intent: "Best for going solo",
    price: { amount: 4200, currency: "USD", deposit: 500 },
    vibe: [
      { label: "Slow Mornings", pct: 84 },
      { label: "Jungle", pct: 78 },
      { label: "After Dark", pct: 66 },
    ],
    hero: image("journeys/tulum-slow-heat/hero.jpg", "Friends jumping into a cenote"),
    heroTall: image("journeys/tulum-slow-heat/hero-tall.jpg", "Friends jumping into a cenote", 1250, 2000),
    card: image("journeys/tulum-slow-heat/card.jpg", "A jungle pool, someone mid-jump", 1400, 1750),
    transition: "stretch",
    promise:
      "Half the group arrives alone. By the second cenote nobody remembers who came with whom.",
    chapters: [
      { numeral: "I", days: "Days 1–2", title: "The jungle house", body: "A villa in the trees ten minutes from the beach, with a pool that glows at night. Tacos at the house, mezcal on the roof, and the first swim before anyone unpacks.", image: ch("tulum-slow-heat", 1, "Friends by the jungle pool at night") },
      { numeral: "II", days: "Day 3", title: "Cenote day", body: "Three cenotes, one driver, no schedule. A cave you swim into, a hole in the jungle you jump into, and a rope swing that ends most arguments.", image: ch("tulum-slow-heat", 2, "Friends jumping into a cenote") },
      { numeral: "III", days: "Day 4", title: "Boat to Sian Ka'an", body: "A lancha through the mangroves to a lagoon the colour of a swimming pool, floating down the channel in life jackets like a very slow river ride. Ceviche on the boat.", image: ch("tulum-slow-heat", 3, "Floating down the lagoon in life jackets") },
      { numeral: "IV", days: "Days 5–6", title: "Beach days", body: "A club on the sand for the day, a temazcal at dusk for those who want it, and the full-moon dinner on the beach that people book Fable for.", image: ch("tulum-slow-heat", 4, "Beach club daybeds, friends laughing") },
      { numeral: "V", days: "Day 7", title: "One more swim", body: "Late breakfast, the ruins at Tulum before the heat if you are up for it, and a last cenote on the way to the airport.", image: ch("tulum-slow-heat", 5, "The last swim, friends in the water") },
    ],
    travellers: pool(
      [16, "Wren", "Portland", 93, "First trip alone. Not for long."],
      [12, "Luca", "Milan", 88],
      [1, "Amara", "Lagos → London", 86],
      [14, "Nour", "Dubai", 85],
      [7, "Kenji", "Osaka → Melbourne", 82],
      [10, "Chloé", "Lyon", 80],
      [15, "Jonah", "Tel Aviv", 79],
      [8, "Sofia", "Buenos Aires", 77],
    ),
    curator: {
      name: "Mateo Cruz",
      role: "Your host · former dive guide, now runs a cenote nobody can find",
      bio: "Mateo has jumped into more holes in the ground than anyone you will meet, and still shouts every time.",
      portrait: curatorPortrait(3),
    },
    inclusions: [
      "Six nights in one jungle villa with a night-lit pool",
      "Private cenote day and the Sian Ka'an boat with lunch",
      "Every meal and every drink at the table, the full-moon beach dinner included",
      "Temazcal ceremony, airport transfers and a driver all week",
      "A group of twelve. Never more.",
    ],
  },
  {
    slug: "cape-town-two-oceans",
    title: "Cape Town, Two Oceans",
    titleEm: "Two Oceans",
    subtitle: "Eight days between a mountain, a beach and a winelands lunch that will not end.",
    region: "Western Cape",
    country: "South Africa",
    season: "Late summer",
    dates: "20 – 27 Feb 2027",
    startDate: "2027-02-20",
    durationDays: 8,
    groupMax: 12,
    spotsRemaining: 5,
    intent: "Best for a milestone birthday",
    price: { amount: 4400, currency: "USD", deposit: 600 },
    vibe: [
      { label: "Big Days Out", pct: 86 },
      { label: "Long Lunches", pct: 90 },
      { label: "After Dark", pct: 61 },
    ],
    hero: image("journeys/cape-town-two-oceans/hero.jpg", "Friends on the beach at Camps Bay at sunset"),
    heroTall: image("journeys/cape-town-two-oceans/hero-tall.jpg", "Friends on the beach at Camps Bay at sunset", 1250, 2000),
    card: image("journeys/cape-town-two-oceans/card.jpg", "Friends at the top of the mountain, arms up", 1400, 1750),
    transition: "ripple",
    promise:
      "A villa in Camps Bay with the mountain behind it and the beach in front. Some of the best days of your year, back to back.",
    chapters: [
      { numeral: "I", days: "Days 1–2", title: "Camps Bay", body: "The villa looks straight at the sunset. First evening is the beach across the road, then a braai on the terrace that goes on longer than planned.", image: ch("cape-town-two-oceans", 1, "Friends on the terrace at sunset") },
      { numeral: "II", days: "Day 3", title: "Up the mountain", body: "Table Mountain on foot before the heat, the cable car down, and a swim at Clifton that resets everything.", image: ch("cape-town-two-oceans", 2, "Friends at the summit, arms in the air") },
      { numeral: "III", days: "Day 4", title: "The winelands", body: "Franschhoek by car. One long lunch that turns into a longer afternoon, a tram between estates, and somebody buying too much wine.", image: ch("cape-town-two-oceans", 3, "A long lunch in the winelands") },
      { numeral: "IV", days: "Days 5–6", title: "Two oceans", body: "Chapman's Peak with the roof down, penguins at Boulders, the Cape of Good Hope, and a catamaran at sunset with the whole group on the net.", image: ch("cape-town-two-oceans", 4, "Friends on the catamaran net at sunset") },
      { numeral: "V", days: "Days 7–8", title: "The last big night", body: "A birthday, if someone has one, and there is usually someone. Dinner at the house, the beach after, and a lazy final day at the pool before the flights.", image: ch("cape-town-two-oceans", 5, "Friends celebrating at the villa at night") },
    ],
    travellers: pool(
      [13, "Hugo", "Copenhagen", 91],
      [2, "Tomas", "Lisbon", 87],
      [16, "Wren", "Portland", 86],
      [8, "Sofia", "Buenos Aires", 80],
      [11, "Yara", "Beirut → Paris", 78],
      [4, "Leonie", "Zürich", 77],
      [9, "Dev", "Toronto", 75],
    ),
    curator: {
      name: "Thandi Mokoena",
      role: "Your host · Capetonian, mountain guide, owner of the best braai on the Atlantic seaboard",
      bio: "Thandi has a rule: nobody leaves Cape Town without one day they will talk about for a decade.",
      portrait: curatorPortrait(4),
    },
    inclusions: [
      "Seven nights in one villa in Camps Bay",
      "Table Mountain guided hike, winelands day with lunch, sunset catamaran",
      "Every meal and every drink at the table, the birthday dinner included",
      "Airport transfers and a private minibus all week",
      "A group of twelve. Never more.",
    ],
  },
];

export const getJourneys = () => journeys;

export const getJourney = (slug: string) => journeys.find((j) => j.slug === slug);

export const formatPrice = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

/** The three journeys teased with the blur-to-focus reveal on the home page. */
export const featuredSlugs = ["bali-in-full-colour", "mykonos-after-dark", "tulum-slow-heat"];

import { curatorPortrait, image, portrait } from "./media";
import type { Journey, Traveller } from "./types";

/**
 * Journey catalogue. Four departures, each a complete package the pages
 * render from. Copy is written to be read slowly: short lines, concrete
 * images, no adjectives that could describe any other trip.
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

export const journeys: Journey[] = [
  {
    slug: "kyoto-in-silence",
    title: "Kyoto, in Silence",
    titleEm: "Silence",
    subtitle: "Nine days inside the quiet hours of an ancient capital.",
    region: "Kansai",
    country: "Japan",
    season: "Late autumn",
    dates: "21 – 29 Nov 2026",
    startDate: "2026-11-21",
    durationDays: 9,
    groupMax: 10,
    spotsRemaining: 2,
    price: { amount: 7400, currency: "USD", deposit: 900 },
    vibe: [
      { label: "Cultural Deep Dive", pct: 85 },
      { label: "Slow Mornings", pct: 68 },
      { label: "After Dark", pct: 31 },
    ],
    hero: image("journeys/kyoto-in-silence/hero.jpg", "Moss garden and maple in mist, Kyoto"),
    card: image("journeys/kyoto-in-silence/card.jpg", "A lantern-lit lane in Gion at dusk", 1400, 1750),
    transition: "dissolve",
    promise:
      "We go in before the gates open and stay after they close. The city you have seen in photographs is not the one you will remember.",
    chapters: [
      {
        numeral: "I",
        days: "Days 1–2",
        title: "Arrive at dusk",
        body:
          "A car meets you at Kansai. By the time you reach the machiya in Gion the lanterns are lit and dinner is a twelve-course kaiseki cooked in a kitchen the size of a wardrobe. Nothing is scheduled tomorrow before ten.",
        image: image("journeys/kyoto-in-silence/chapter-01.jpg", "Lantern-lit wooden façades in Gion"),
      },
      {
        numeral: "II",
        days: "Days 3–4",
        title: "The moss temples, alone",
        body:
          "Saihō-ji admits a handful of visitors a day. We are the first through the gate, before the tour buses find the road. You will copy a sutra in ink, then walk a garden that has been growing for six hundred years.",
        image: image("journeys/kyoto-in-silence/chapter-02.jpg", "Moss garden with stone lantern and soft light"),
      },
      {
        numeral: "III",
        days: "Day 5",
        title: "Tea with the fifteenth generation",
        body:
          "In Uji a family has been roasting tea since 1580. The master will not sell you anything. He will pour, wait, and pour again, and by the third cup you will understand why we came.",
        image: image("journeys/kyoto-in-silence/chapter-03.jpg", "Steam rising from a tea bowl on a dark table"),
      },
      {
        numeral: "IV",
        days: "Days 6–7",
        title: "Kurama to Kibune, on foot",
        body:
          "A mountain path, a cedar forest, a shrine where the lanterns line the stairs. We sleep in a ryokan above the river and eat trout grilled on a fire the innkeeper's grandmother lit.",
        image: image("journeys/kyoto-in-silence/chapter-04.jpg", "Stone stairway lined with red lanterns in cedar forest"),
      },
      {
        numeral: "V",
        days: "Days 8–9",
        title: "Arashiyama before dawn",
        body:
          "The bamboo grove at 5:40 in the morning belongs to the crows and to us. Then a final breakfast on the river, and the car to the airport, and the long quiet you will carry home.",
        image: image("journeys/kyoto-in-silence/chapter-05.jpg", "Bamboo grove path in pale dawn light"),
      },
    ],
    travellers: pool(
      [1, "Amara", "Lagos → London", 94, "Second journey with Fable."],
      [2, "Tomas", "Lisbon", 91],
      [3, "Priya", "Mumbai → Berlin", 88],
      [4, "Leonie", "Zürich", 87, "Ceramicist. Bringing a sketchbook."],
      [5, "Marcus", "Chicago", 85],
      [6, "Ingrid", "Oslo", 83],
      [7, "Kenji", "Osaka → Melbourne", 82, "Going home, slowly."],
      [8, "Sofia", "Buenos Aires", 79],
    ),
    curator: {
      name: "Mika Sato",
      role: "Your host · former Kyoto correspondent, The Financial Times",
      bio: "Mika lived in a machiya off Sanjō for eleven years. She still knows which temple gate opens first.",
      portrait: curatorPortrait(1),
    },
    inclusions: [
      "Eight nights: Gion machiya, mountain ryokan, riverside inn",
      "Private access to Saihō-ji and Uji tea house",
      "All meals, including two kaiseki dinners",
      "Airport transfers and every train in between",
      "A group of ten. Never more.",
    ],
  },
  {
    slug: "patagonia-unhurried",
    title: "Patagonia, Unhurried",
    titleEm: "Unhurried",
    subtitle: "Eleven days at the bottom of the world, walking at the speed of weather.",
    region: "Magallanes & Santa Cruz",
    country: "Chile & Argentina",
    season: "Late summer",
    dates: "6 – 16 Mar 2027",
    startDate: "2027-03-06",
    durationDays: 11,
    groupMax: 12,
    spotsRemaining: 4,
    price: { amount: 9200, currency: "USD", deposit: 1100 },
    vibe: [
      { label: "Wild Expedition", pct: 78 },
      { label: "Fireside Conversation", pct: 64 },
      { label: "City Time", pct: 18 },
    ],
    hero: image("journeys/patagonia-unhurried/hero.jpg", "Granite towers above a glacial lake at first light"),
    card: image("journeys/patagonia-unhurried/card.jpg", "A lone rider on the steppe under a vast sky", 1400, 1750),
    transition: "stretch",
    promise:
      "No itinerary survives the wind here, so we wrote one that bends. Twelve people, two guides, and the largest sky you will ever stand under.",
    chapters: [
      {
        numeral: "I",
        days: "Days 1–3",
        title: "Base of the towers",
        body:
          "A lodge on the shore of Lago Pehoé where the windows face the massif. We walk the first morning to loosen the legs and spend the second in the French Valley until the light goes.",
        image: image("journeys/patagonia-unhurried/chapter-01.jpg", "Turquoise lake beneath granite peaks"),
      },
      {
        numeral: "II",
        days: "Days 4–5",
        title: "Grey Glacier, by water",
        body:
          "A boat the colour of the lake takes us to the wall of the glacier. It calves twice while we are there. Someone will cry. It is usually the person who said they would not.",
        image: image("journeys/patagonia-unhurried/chapter-02.jpg", "Blue glacier face rising from dark water"),
      },
      {
        numeral: "III",
        days: "Days 6–7",
        title: "The estancia",
        body:
          "A working sheep station older than the border. Horses in the morning, lamb over the fire at night, a gaucho who has never left the valley and does not see the point.",
        image: image("journeys/patagonia-unhurried/chapter-03.jpg", "Horses on open steppe at golden hour"),
      },
      {
        numeral: "IV",
        days: "Days 8–10",
        title: "Across the line to El Chaltén",
        body:
          "Argentina. Fitz Roy at dawn from the lagoon, if the mountain permits. If it does not, there is a bakery, a river, and the best conversation of the trip.",
        image: image("journeys/patagonia-unhurried/chapter-04.jpg", "Jagged peaks reflected in a still lagoon"),
      },
      {
        numeral: "V",
        days: "Day 11",
        title: "The long way out",
        body:
          "A last breakfast with the door open to the wind. Then the road north, the airport, and a silence in the group that nobody wants to be first to break.",
        image: image("journeys/patagonia-unhurried/chapter-05.jpg", "Empty road across the steppe toward distant mountains"),
      },
    ],
    travellers: pool(
      [9, "Elena", "Madrid", 92],
      [10, "Daniel", "Cape Town", 90, "Third Fable journey."],
      [11, "Yara", "Beirut → Paris", 86],
      [12, "Olamide", "Toronto", 84],
      [13, "Hugo", "Copenhagen", 81, "Landscape photographer."],
      [14, "Nadia", "Amsterdam", 80],
      [15, "Rafael", "São Paulo", 77],
      [16, "Wren", "Portland", 76],
    ),
    curator: {
      name: "Sebastián Rojas",
      role: "Your guide · mountain guide, 22 seasons in Torres del Paine",
      bio: "Sebastián has walked the W more times than he will admit. He still stops at the same bend to look.",
      portrait: curatorPortrait(2),
    },
    inclusions: [
      "Ten nights: lakeside lodge, estancia, mountain hotel",
      "Two guides for twelve travellers",
      "Glacier navigation and all park permits",
      "Every meal, every transfer, both borders",
      "A weather day built in. We will use it.",
    ],
  },
  {
    slug: "sahara-under-glass",
    title: "Sahara, Under Glass",
    titleEm: "Glass",
    subtitle: "Seven days from a Marrakech riad to a glass-domed camp in the dunes.",
    region: "Marrakech-Safi & Drâa-Tafilalet",
    country: "Morocco",
    season: "Autumn",
    dates: "10 – 16 Oct 2026",
    startDate: "2026-10-10",
    durationDays: 7,
    groupMax: 8,
    spotsRemaining: 1,
    price: { amount: 5900, currency: "USD", deposit: 700 },
    vibe: [
      { label: "Slow Luxury", pct: 91 },
      { label: "Desert Silence", pct: 73 },
      { label: "Souk Hunting", pct: 39 },
    ],
    hero: image("journeys/sahara-under-glass/hero.jpg", "Dune ridges in the last amber light"),
    card: image("journeys/sahara-under-glass/card.jpg", "A glass dome glowing under the desert stars", 1400, 1750),
    transition: "ripple",
    promise:
      "Eight travellers. One night under a ceiling of glass with nothing between you and the Milky Way but a wool blanket.",
    chapters: [
      {
        numeral: "I",
        days: "Days 1–2",
        title: "The riad",
        body:
          "Behind a door you would walk past, a courtyard with a fountain and a fig tree. Dinner on the roof. The medina is a rumour beyond the wall until you are ready for it.",
        image: image("journeys/sahara-under-glass/chapter-01.jpg", "Courtyard fountain under carved cedar arches"),
      },
      {
        numeral: "II",
        days: "Day 3",
        title: "Over the Atlas",
        body:
          "The Tizi n'Tichka pass at eleven in the morning, mint tea at the top, and the moment the land turns from green to the colour of bread.",
        image: image("journeys/sahara-under-glass/chapter-02.jpg", "Mountain pass road winding through ochre hills"),
      },
      {
        numeral: "III",
        days: "Day 4",
        title: "Skoura palm grove",
        body:
          "A kasbah in a thousand-year-old oasis. We do nothing here on purpose. Read, swim, sleep with the shutters open.",
        image: image("journeys/sahara-under-glass/chapter-03.jpg", "Palm grove and mud-brick kasbah at midday"),
      },
      {
        numeral: "IV",
        days: "Days 5–6",
        title: "Erg Chebbi, under glass",
        body:
          "Camels for the last hour because the dunes ask for it. Then the camp: eight domes, a fire, a Berber astronomer who names the stars in three languages. You sleep looking up.",
        image: image("journeys/sahara-under-glass/chapter-04.jpg", "Glass dome tents on a dune at twilight"),
      },
      {
        numeral: "V",
        days: "Day 7",
        title: "Dawn from the high dune",
        body:
          "We climb in the dark. The sun does what it does. Then coffee, the long drive back to the green, and a flight home you will spend staring out of the window.",
        image: image("journeys/sahara-under-glass/chapter-05.jpg", "Sunrise over rippled sand dunes"),
      },
    ],
    travellers: pool(
      [3, "Priya", "Mumbai → Berlin", 95],
      [6, "Ingrid", "Oslo", 93],
      [10, "Daniel", "Cape Town", 90],
      [12, "Olamide", "Toronto", 89, "Celebrating forty."],
      [1, "Amara", "Lagos → London", 88],
      [14, "Nadia", "Amsterdam", 84],
      [5, "Marcus", "Chicago", 82],
    ),
    curator: {
      name: "Leïla Benali",
      role: "Your host · hotelier, born in Skoura",
      bio: "Leïla's family has kept the kasbah for four generations. She chose the camp's astronomer herself.",
      portrait: curatorPortrait(3),
    },
    inclusions: [
      "Six nights: riad, kasbah, glass-domed desert camp",
      "Private 4×4 across the Atlas and Drâa valley",
      "Every meal, from rooftop to campfire",
      "Camels, astronomer, and a dune to yourself",
      "A group of eight. Intimacy is the luxury.",
    ],
  },
  {
    slug: "iceland-edge-of-light",
    title: "Iceland, at the Edge of Light",
    titleEm: "Light",
    subtitle: "Eight days of black sand, blue ice and a sky that may or may not perform.",
    region: "South Coast & Highlands",
    country: "Iceland",
    season: "Deep winter",
    dates: "12 – 19 Feb 2027",
    startDate: "2027-02-12",
    durationDays: 8,
    groupMax: 10,
    spotsRemaining: 5,
    price: { amount: 6800, currency: "USD", deposit: 800 },
    vibe: [
      { label: "Elemental", pct: 82 },
      { label: "Aurora Hunting", pct: 66 },
      { label: "Thermal Rituals", pct: 58 },
    ],
    hero: image("journeys/iceland-edge-of-light/hero.jpg", "Aurora over a black-sand coast and sea stacks"),
    card: image("journeys/iceland-edge-of-light/card.jpg", "Steam rising from a thermal pool at blue hour", 1400, 1750),
    transition: "dissolve",
    promise:
      "Five hours of daylight, used with intent. The rest of the time is for the dark, the water, and the sky.",
    chapters: [
      {
        numeral: "I",
        days: "Days 1–2",
        title: "Reykjavík, briefly",
        body:
          "One night in the city to shake off the flight, a swim in a public pool at seven in the morning with the locals, and then the road east.",
        image: image("journeys/iceland-edge-of-light/chapter-01.jpg", "Harbour lights on dark water in winter"),
      },
      {
        numeral: "II",
        days: "Days 3–4",
        title: "The black coast",
        body:
          "Reynisfjara in a gale, a glacier tongue you can walk on with crampons, and a farmhouse where the owner keeps the northern lights forecast on the fridge.",
        image: image("journeys/iceland-edge-of-light/chapter-02.jpg", "Waves on black sand beneath basalt columns"),
      },
      {
        numeral: "III",
        days: "Day 5",
        title: "Inside the ice",
        body:
          "A cave beneath Vatnajökull that will not exist next year. Blue in a way that makes the word feel inadequate.",
        image: image("journeys/iceland-edge-of-light/chapter-03.jpg", "Inside a blue glacial ice cave"),
      },
      {
        numeral: "IV",
        days: "Days 6–7",
        title: "The hot river",
        body:
          "Snow on the banks, steam on the water, a walk in and a longer walk out. At night we drive away from every light on the island and wait.",
        image: image("journeys/iceland-edge-of-light/chapter-04.jpg", "Steaming river through a snowy valley"),
      },
      {
        numeral: "V",
        days: "Day 8",
        title: "The last dark morning",
        body:
          "Lagoon at first light, the ice drifting to the sea. Then the airport. You will look for the sky out of the plane window. Everyone does.",
        image: image("journeys/iceland-edge-of-light/chapter-05.jpg", "Icebergs drifting in a lagoon at dawn"),
      },
    ],
    travellers: pool(
      [13, "Hugo", "Copenhagen", 91],
      [2, "Tomas", "Lisbon", 87],
      [16, "Wren", "Portland", 86, "First time this far north."],
      [8, "Sofia", "Buenos Aires", 80],
      [11, "Yara", "Beirut → Paris", 78],
    ),
    curator: {
      name: "Ásta Jónsdóttir",
      role: "Your guide · glacier guide and search-and-rescue volunteer",
      bio: "Ásta reads the sky the way other people read the news. She has never promised an aurora and never needed to.",
      portrait: curatorPortrait(4),
    },
    inclusions: [
      "Seven nights: city hotel, coastal farmhouse, glacier lodge",
      "Ice-cave and glacier walk with certified guides",
      "Thermal river and lagoon access",
      "Every meal and a private 4×4 for ten",
      "Two aurora nights, one weather night, all yours.",
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
export const featuredSlugs = ["kyoto-in-silence", "sahara-under-glass", "patagonia-unhurried"];

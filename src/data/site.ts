export const site = {
  name: "BachataVan",
  instagram: "https://www.instagram.com/bachatavan_official/",
  whatsappInvite: "https://chat.whatsapp.com/KkE6kn56sAh6m4tEDtL08K",
  pickup: "Sagrada Família, Barcelona",
  pickupMap: "https://maps.app.goo.gl/x6c6GEqHpAciMcgd8?g_st=ic",
  timezone: "Europe/Madrid",
};

export type Trip = {
  id: string;
  name: string;
  day: string;
  dayShort: string;
  tagline: string;
  description: string;
  start: string;
  end: string;
  nextDay: boolean;
  paymentUrl: string;
  theme: "gold" | "green";
  label: string;
};

// Transcribed from the organizer's WhatsApp screenshot. No prices, seat
// inventory, venue admission, or cancellation terms have been assumed.
export const trips: Trip[] = [
  {
    id: "manisero",
    name: "Manisero",
    day: "Saturday",
    dayShort: "SAT",
    tagline: "For the late-night dancers.",
    description:
      "Make Saturday a dance night. Meet the BachataVan crew at Sagrada Família and head to Manisero together.",
    start: "23:45",
    end: "03:45",
    nextDay: true,
    paymentUrl: "https://pay.sumup.com/b2c/QJKX7KNW",
    theme: "gold",
    label: "Saturday after dark",
  },
  {
    id: "quechimba",
    name: "Quechimba",
    day: "Sunday",
    dayShort: "SUN",
    tagline: "Your Sunday, with a little more rhythm.",
    description:
      "Keep the weekend dancing. Join the crew for an evening at Quechimba, starting together at Sagrada Família.",
    start: "18:00",
    end: "23:00",
    nextDay: false,
    paymentUrl: "https://pay.sumup.com/b2c/QTN3EOLR",
    theme: "green",
    label: "The Sunday session",
  },
];

// Weekly operating pattern and payment links confirmed by the organizer.
// Cancel a particular occurrence by adding its date to cancelledDates.
export const weeklySchedule = [
  { weekday: 6, tripId: "manisero" },
  { weekday: 0, tripId: "quechimba" },
];
export const cancelledDates: string[] = [];
export const scheduleStart = "2026-10-04";

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getTripForDate(date: Date): Trip | undefined {
  const key = dateKey(date);
  if (key < scheduleStart || cancelledDates.includes(key)) return undefined;
  const entry = weeklySchedule.find((s) => s.weekday === date.getDay());
  return entry ? trips.find((t) => t.id === entry.tripId) : undefined;
}

export function getBarcelonaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: site.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return new Date(value("year"), value("month") - 1, value("day"), 12);
}

export const faqs = [
  {
    category: "Getting started",
    question: "What is BachataVan?",
    answer:
      "BachataVan brings people together for social dance parties, festivals, trips, and airport pickups. Our community shares schedules, booking links, and trip updates. Weekly bachata and salsa trips leave from Sagrada Família in Barcelona.",
  },
  {
    category: "Getting started",
    question: "Can I arrange a festival trip or an airport pickup?",
    answer:
      "Yes — contact the organizer through the BachataVan community or @bachatavan_official on Instagram to ask about festival trips and airport pickups. Confirm availability, times, meeting point, and payment details for your journey. The Sagrada Família pickup shown in our calendar applies to the listed weekly dance trips.",
  },
  {
    category: "Getting started",
    question: "Can I come on my own?",
    answer:
      "You can contact BachataVan as an individual — you do not need to organize a group to ask for a seat. Let the organizer know it is your first trip so they can help you get settled.",
  },
  {
    category: "Getting started",
    question: "Do I need a dance partner or experience?",
    answer:
      "Ask the organizer about the particular event and its dance level before booking. Partner requirements, workshops, and admission rules are set by each venue.",
  },
  {
    category: "Booking & payment",
    question: "How do I book a seat?",
    answer:
      "Choose your trip, then check the date and seat availability in the BachataVan community. Pay using the SumUp link for that trip. Your seat is confirmed only once payment is received. No payment means no reservation. Seats are allocated on a first-come, first-served basis.",
  },
  {
    category: "Booking & payment",
    question: "How much does a trip cost?",
    answer:
      "Open the trip’s SumUp link to see the current amount before paying. Confirm with the organizer what your payment includes and that a seat is available for your chosen date.",
  },
  {
    category: "Booking & payment",
    question: "Is entry to the dance venue included?",
    answer:
      "Please confirm this for your chosen trip before paying. Transport, venue admission, and workshops may be handled separately; a payment link alone does not confirm what is included.",
  },
  {
    category: "Booking & payment",
    question: "What if I need to cancel or change my booking?",
    answer:
      "Contact the organizer as soon as possible. Confirm the cancellation, refund, and transfer terms before paying; a standard policy has not yet been published on this website.",
  },
  {
    category: "The trip",
    question: "Where do we meet?",
    answer:
      "The shared pickup point is at Sagrada Família in Barcelona. Use the pickup map in your trip details and check the latest community message for the exact meeting instructions.",
  },
  {
    category: "The trip",
    question: "What are the trip times?",
    answer:
      "The shared schedule lists Manisero on Saturday, 23:45–03:45 (finishing Sunday), and Quechimba on Sunday, 18:00–23:00. All times are local to Barcelona. Confirm the date, departure, and return arrangements with the organizer before booking.",
  },
  {
    category: "The trip",
    question: "What happens if I am running late?",
    answer:
      "Punctuality is mandatory. Departure is at the announced time; any waiting is limited to a maximum of 10 minutes. Arrive on time rather than relying on this waiting window. Message the organizer straight away if you are delayed. Further delays are not accepted out of respect for the group.",
  },
  {
    category: "The trip",
    question: "Where can I find the latest updates?",
    answer:
      "Check the BachataVan WhatsApp community for booking messages and changes. Use any ‘Join the community’ button on this website to open the invite. You can also follow @bachatavan_official on Instagram for updates.",
  },
  {
    category: "Community rules",
    question: "What behaviour is expected during a trip?",
    answer:
      "Treat every passenger and the driver with respect. Verbal or physical aggression results in immediate exclusion from the BachataVan group. Respect is non-negotiable.",
  },
  {
    category: "Community rules",
    question: "Who pays if someone damages the van?",
    answer:
      "The person responsible for any damage to the van must pay for it. Please take care of the vehicle and respect the shared space.",
  },
  {
    category: "Community rules",
    question: "Can I bring food or drinks into the van?",
    answer:
      "Only water is allowed inside the van. No food or other drinks — including alcohol — are permitted.",
  },
  {
    category: "Community rules",
    question: "Who is responsible for my personal belongings?",
    answer:
      "Each passenger is responsible for their own belongings. BachataVan is not responsible for lost items. Check that you have everything with you before leaving the van.",
  },
  {
    category: "Community rules",
    question: "Are music and good vibes welcome?",
    answer:
      "Absolutely. Smiles, music, and dance energy are welcome, while following the rules and respecting the group. Good vibes are encouraged; discipline comes first.",
  },
];

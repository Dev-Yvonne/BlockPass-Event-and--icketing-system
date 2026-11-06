/**
 * Seeds the demo storefront and funds each event's issuer. Dates are relative
 * to today so events stay bookable, and logins are randomised so a deployed
 * copy has no published password. Re-running updates event profiles and leaves
 * sales alone. Demo purchases are real testnet transactions.
 *
 *   npm run seed
 */
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../src/config/db";
import Booking from "../src/models/Booking";
import Event from "../src/models/Event";
import Review from "../src/models/Review";
import User from "../src/models/User";
import { checkout } from "../src/services/checkout";
import { ensureEventIssuer } from "../src/services/stellar/provisioning";

const DAY_MS = 24 * 60 * 60 * 1000;

function tiers(general: [number, number], vip: [number, number]) {
  return [
    { name: "General Admission", description: "Standard entry", price: general[0], capacity: general[1], remaining: general[1] },
    { name: "VIP", description: "Priority entry and reserved area", price: vip[0], capacity: vip[1], remaining: vip[1] },
  ];
}

const STANDARD_NOTES =
  "Doors open one hour before the first act. Bring a photo ID that matches your ticket name.";

const EVENTS = [
  {
    title: "Nairobi Cultural Nights",
    description:
      "Three stages of Kenyan music, dance and food in the heart of Nairobi. Maasai adumu performers, coastal taarab, benga bands and contemporary Kenyan artists share one evening, with craft stalls and nyama choma from local vendors throughout.\n\nThe evening is designed for families and first-time visitors as much as for music lovers, with seating areas, a children's craft corner and step-free access across the grounds.",
    category: "Festival",
    venue: "Uhuru Gardens, Nairobi",
    localCurrency: "KES",
    inDays: 21,
    imageUrl: "/images/maasai-adumu.jpg",
    gallery: ["/images/kenya-dancers.jpg", "/images/maasai-community.jpg", "/images/nairobi-skyline.jpg", "/images/kenya-nyama-choma.jpg", "/images/nairobi-dusk.jpg"],
    highlights: ["Three live stages", "Maasai, Swahili and Luo performance traditions", "Local food and craft market", "Family-friendly seating areas"],
    schedule: [
      { time: "15:00", title: "Gates open, craft market and food stalls" },
      { time: "16:30", title: "Traditional dance showcase" },
      { time: "18:30", title: "Benga and taarab sets" },
      { time: "20:00", title: "Headline performance" },
      { time: "22:00", title: "Event closes" },
    ],
    venueNotes: "Uhuru Gardens is on Lang'ata Road. Parking is limited, so public transport or ride-hailing is recommended.",
    tiers: tiers([15, 800], [40, 100]),
  },
  {
    title: "Mombasa Heritage Festival",
    description:
      "A celebration of Swahili coastal heritage at Fort Jesus, with traditional dance, Giriama music, and food from the Kenyan coast.",
    category: "Festival",
    venue: "Fort Jesus, Mombasa",
    localCurrency: "KES",
    inDays: 1,
    imageUrl: "/images/mombasa-fort-jesus.jpg",
    gallery: ["/images/kenya-costume-detail.jpg", "/images/giriama-shakers.jpg", "/images/kenya-dancers.jpg"],
    highlights: ["Evening performances inside the fort", "Coastal food market", "Heritage walking tours"],
    schedule: [
      { time: "14:00", title: "Heritage walking tours" },
      { time: "17:00", title: "Giriama and Mijikenda performances" },
      { time: "19:00", title: "Taarab evening" },
    ],
    venueNotes: "Fort Jesus is in Mombasa Old Town, a short walk from Mama Ngina Waterfront.",
    tiers: tiers([10, 300], [25, 60]),
  },
  {
    title: "Lagos Live Nights",
    description:
      "An open-air night of Afrobeat, amapiano, and live band sets on Lagos's biggest outdoor stage. Doors open at 6pm with food vendors and DJ sets before the headline acts.",
    category: "Concert",
    venue: "Tafawa Balewa Square, Lagos",
    localCurrency: "NGN",
    inDays: 30,
    imageUrl: "/images/lagos-live-nights.jpg",
    gallery: ["/images/lagos-skyline.jpg", "/images/lagos-island.jpg"],
    highlights: ["Full live band stage", "Open-air city centre venue", "Food vendors from 6pm"],
    schedule: [
      { time: "18:00", title: "Doors open, DJ sets and food vendors" },
      { time: "20:00", title: "Support acts" },
      { time: "21:30", title: "Headline set" },
    ],
    venueNotes: STANDARD_NOTES,
    tiers: tiers([25, 450], [60, 50]),
  },
  {
    title: "Kinshasa Sound Stage",
    description:
      "Congolese rumba legends and rising stars share one stage for a night celebrating the sound that built Kinshasa's music scene.",
    category: "Concert",
    venue: "Stade des Martyrs, Kinshasa",
    localCurrency: "CDF",
    inDays: 45,
    imageUrl: "/images/kinshasa-sound-stage.jpg",
    gallery: ["/images/kinshasa-congo-river.jpg", "/images/kinshasa-boulevard.jpg"],
    highlights: ["Rumba across the generations", "Stadium sound and staging", "Reserved VIP seating"],
    schedule: [
      { time: "17:00", title: "Gates open" },
      { time: "19:00", title: "Rising stars set" },
      { time: "21:00", title: "Rumba headliners" },
    ],
    venueNotes: STANDARD_NOTES,
    tiers: tiers([18, 700], [45, 100]),
  },
  {
    title: "Accra Street Culture Fest",
    description:
      "A full day of street art, live mural painting, drumming circles, and local designers taking over Jamestown's streets.",
    category: "Community",
    venue: "Jamestown, Accra",
    localCurrency: "GHS",
    inDays: 60,
    imageUrl: "/images/accra-street-culture-fest.jpg",
    gallery: ["/images/accra-jamestown-lighthouse.jpg", "/images/kente-adowa.jpg"],
    highlights: ["Live mural painting", "Drumming circles", "Local designer market"],
    schedule: [
      { time: "10:00", title: "Street market opens" },
      { time: "13:00", title: "Drumming circles" },
      { time: "16:00", title: "Live mural reveal" },
    ],
    venueNotes: "Jamestown streets are closed to traffic for the day, so plan to arrive on foot.",
    tiers: tiers([8, 1100], [20, 100]),
  },
  {
    title: "Golden Coast Concert",
    description:
      "Ghana's top highlife and hiplife acts headline an evening concert on the Accra coastline, with a sunset opening set.",
    category: "Concert",
    venue: "Black Star Square, Accra",
    localCurrency: "GHS",
    inDays: 75,
    imageUrl: "/images/golden-coast-concert.jpg",
    gallery: ["/images/adowa-dancer.jpg", "/images/kente-adowa.jpg"],
    highlights: ["Sunset opening set", "Highlife and hiplife headliners", "Coastal open-air venue"],
    schedule: [
      { time: "17:30", title: "Sunset opening set" },
      { time: "19:30", title: "Highlife set" },
      { time: "21:00", title: "Hiplife headliners" },
    ],
    venueNotes: STANDARD_NOTES,
    tiers: tiers([20, 550], [50, 50]),
  },
  {
    title: "Kilifi Cultural Gathering",
    description:
      "A community celebration of Mijikenda heritage: traditional dance, drumming, and food stalls along the Kilifi coastline.",
    category: "Community",
    venue: "Kilifi Creek Grounds, Kilifi",
    localCurrency: "KES",
    inDays: 90,
    imageUrl: "/images/kilifi-cultural-gathering.jpg",
    gallery: ["/images/giriama-shakers.jpg", "/images/kenya-costume-detail.jpg", "/images/kenya-nyama-choma.jpg"],
    highlights: ["Mijikenda dance and drumming", "Community food stalls", "Creekside venue"],
    schedule: [
      { time: "09:00", title: "Opening procession" },
      { time: "11:00", title: "Dance and drumming performances" },
      { time: "14:00", title: "Community food fair" },
    ],
    venueNotes: STANDARD_NOTES,
    tiers: tiers([5, 350], [15, 50]),
  },
];

/** Clearly labelled sample feedback for the demo event that has already ended. */
const SAMPLE_REVIEWS = [
  { name: "Achieng Odhiambo", rating: 5, comment: "Entry took under a minute and the ticket details were easy to find. The evening performances inside the fort were the highlight." },
  { name: "Brian Kiprono", rating: 5, comment: "Very well organised. I liked that my ticket had its own serial number and could be checked online." },
  { name: "Fatuma Salim", rating: 4, comment: "Great programme and food market. The walking tour filled up quickly, so more slots would help." },
  { name: "Daniel Mwangi", rating: 5, comment: "Registration was simple and I didn't need to install anything. Would attend again next year." },
  { name: "Grace Wanjiku", rating: 4, comment: "Lovely atmosphere and friendly staff. Signage inside the fort could be clearer after dark." },
  { name: "Hassan Omar", rating: 3, comment: "Good performances, but the queue for food was long around seven o'clock." },
];

async function demoUser(email: string, name: string) {
  return (
    (await User.findOne({ email })) ??
    User.create({
      email,
      name,
      password: crypto.randomBytes(24).toString("hex"),
      role: "attendee",
    })
  );
}

/** Real testnet purchases, so the sample reviews come from actual ticket holders. */
async function buy(
  eventId: string,
  tierName: string,
  user: { _id: unknown; name: string; email: string },
  quantity: number,
  paymentMethod: "stablecoin" | "local",
  currency: string
) {
  const event = await Event.findById(eventId);
  const tier = event!.tiers.find((candidate) => candidate.name === tierName)!;
  const booking = await checkout({
    eventId,
    tierId: tier._id.toString(),
    name: user.name,
    email: user.email,
    quantity,
    checkoutId: crypto.randomUUID(),
    paymentMethod,
    currency,
    phone: "+254700000000",
    userId: user._id as never,
  });
  console.log(`Ticket:  ${user.name}, ${event!.title}: ${booking.status}`);
}

async function seedSampleFeedback() {
  const event = await Event.findOne({ title: "Mombasa Heritage Festival" });
  if (!event || (await Review.countDocuments({ event: event._id })) === SAMPLE_REVIEWS.length) return;

  for (const [index, sample] of SAMPLE_REVIEWS.entries()) {
    const user = await demoUser(`sample${index + 1}@blockpass.co.ke`, sample.name);
    const held = () => Booking.exists({ event: event._id, user: user._id, status: "confirmed" });
    if (!(await held())) {
      await buy(
        event._id.toString(),
        index % 3 === 0 ? "VIP" : "General Admission",
        user,
        1,
        index % 2 === 0 ? "local" : "stablecoin",
        "KES"
      );
    }
    if (!(await held())) throw new Error(`Sample purchase failed for ${sample.name}`);
    await Review.updateOne(
      { event: event._id, user: user._id },
      { $set: { rating: sample.rating, comment: sample.comment, sample: true } },
      { upsert: true }
    );
  }

  // Sales needed the event open; now it becomes the demo's ended event.
  await Event.updateOne(
    { _id: event._id },
    { date: new Date(new Date(Date.now() - 12 * DAY_MS).setUTCHours(14, 0, 0, 0)) }
  );
}

async function seedDemoAttendee() {
  const attendee = await demoUser("attendee@blockpass.co.ke", "Wanjiru Kamau");
  const holds = async (eventId: unknown) =>
    Booking.exists({ user: attendee._id, event: eventId, status: "confirmed" });

  const nairobi = await Event.findOne({ title: "Nairobi Cultural Nights" });
  const lagos = await Event.findOne({ title: "Lagos Live Nights" });
  if (nairobi && !(await holds(nairobi._id))) {
    await buy(nairobi._id.toString(), "VIP", attendee, 2, "local", "KES");
  }
  if (lagos && !(await holds(lagos._id))) {
    await buy(lagos._id.toString(), "General Admission", attendee, 1, "stablecoin", "KES");
  }
}

async function main() {
  await connectDB();

  let organizer = await User.findOne({ email: "organizer@blockpass.co.ke" });
  if (!organizer) {
    organizer = await User.create({
      name: "BlockPass Events",
      email: "organizer@blockpass.co.ke",
      password: crypto.randomBytes(24).toString("hex"),
      role: "organizer",
    });
  }

  for (const { inDays, ...event } of EVENTS) {
    const { title, gallery, highlights, schedule, venueNotes, localCurrency, description, imageUrl } = event;
    const profile = { gallery, highlights, schedule, venueNotes, localCurrency, description, imageUrl };
    if (await Event.exists({ title })) {
      await Event.updateOne({ title }, { $set: profile });
      console.log(`Updated: ${title}`);
      continue;
    }
    await Event.create({
      ...event,
      date: new Date(new Date(Date.now() + inDays * DAY_MS).setUTCHours(17, 0, 0, 0)),
      price: Math.min(...event.tiers.map((tier) => tier.price)),
      capacity: event.tiers.reduce((sum, tier) => sum + tier.capacity, 0),
      organizer: organizer._id,
    });
    console.log(`Created: ${title}`);
  }

  // Fund issuers now so no attendee's checkout has to wait on Friendbot.
  for (const event of await Event.find({ title: { $in: EVENTS.map((e) => e.title) } })) {
    const issuer = await ensureEventIssuer(event);
    console.log(`Issuer:  ${event.title} ${issuer.publicKey()}`);
  }

  await seedSampleFeedback();
  await seedDemoAttendee();

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

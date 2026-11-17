import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/*
 * Replaces the expire-reservations edge function + CRON_SECRET:
 * every minute, release seat holds whose 10-minute window lapsed.
 */
const crons = cronJobs();

crons.interval(
  "release expired reservations",
  { minutes: 1 },
  internal.bookings.releaseExpiredReservationsInternal,
);

export default crons;

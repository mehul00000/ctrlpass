import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

// Automatic catalog synchronization — every 6 hours.
const crons = cronJobs();

crons.interval(
  "sync tmdb catalog",
  { hours: 6 },
  api.catalog.syncAll,
  {},
);

export default crons;

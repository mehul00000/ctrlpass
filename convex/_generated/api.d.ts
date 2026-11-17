/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as bookings from "../bookings.js";
import type * as checkins from "../checkins.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as helpers from "../helpers.js";
import type * as lib_cashfree from "../lib/cashfree.js";
import type * as organizers from "../organizers.js";
import type * as payments from "../payments.js";
import type * as staff from "../staff.js";
import type * as ticketTypes from "../ticketTypes.js";
import type * as users from "../users.js";
import type * as volunteers from "../volunteers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  bookings: typeof bookings;
  checkins: typeof checkins;
  crons: typeof crons;
  events: typeof events;
  helpers: typeof helpers;
  "lib/cashfree": typeof lib_cashfree;
  organizers: typeof organizers;
  payments: typeof payments;
  staff: typeof staff;
  ticketTypes: typeof ticketTypes;
  users: typeof users;
  volunteers: typeof volunteers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

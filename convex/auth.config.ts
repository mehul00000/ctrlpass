import { AuthConfig } from "convex/server";

// Clerk is the sole identity provider (Supabase auth removed).
// The issuer domain is set per-deployment via the CLERK_JWT_ISSUER_DOMAIN env var.
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;

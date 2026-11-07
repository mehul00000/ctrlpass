// ---------------------------------------------------------------------------
// Official Clerk integration for Convex (convex/auth.config.ts).
//
// Requires these environment variables on the deployment (set via
// `npx convex env set`):
//   CLERK_ISSUER          e.g. https://casual-yak-4312.clerk.accounts.dev
//   CLERK_JWT_PUBLIC_KEY  the instance's JWT public key (PEM)
// And a Clerk JWT template named "convex" containing the claim
//   { "sub": "{{user.id}}" }
// ---------------------------------------------------------------------------

export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER!,
      applicationID: "convex",
    },
  ],
  logLevel: "WARNING",
};

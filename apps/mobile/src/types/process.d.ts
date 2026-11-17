/** Hermes/RN exposes process.env with EXPO_PUBLIC_* inlined at bundle time.
 *  Convex server code (compiled through this tsconfig) also reads process.env,
 *  so keep an index signature for arbitrary vars. */
declare const process: {
  env: Record<string, string | undefined> & {
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
    EXPO_PUBLIC_CONVEX_URL?: string;
    EXPO_PUBLIC_CASHFREE_ENV?: string;
  };
};

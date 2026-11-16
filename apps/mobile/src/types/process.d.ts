/** Hermes/RN exposes process.env with EXPO_PUBLIC_* inlined at bundle time. */
declare const process: {
  env: {
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  };
};

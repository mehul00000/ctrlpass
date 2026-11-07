import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { UserProvider } from "@/lib/user-context";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CtrlPass — Your World of Cinema",
    template: "%s | CtrlPass",
  },
  description:
    "CtrlPass is a premium movie, TV series and anime discovery platform. Explore trending, popular and upcoming titles powered by TMDB.",
  applicationName: "CtrlPass",
};

export const viewport: Viewport = {
  themeColor: "#38000A",
  width: "device-width",
  initialScale: 1,
};

// Inlined at build time — decides whether Clerk features are active.
const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tree = (
    <UserProvider>
      <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileNav />
      </div>
    </UserProvider>
  );

  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="font-sans">
        {CLERK_ENABLED ? (
          <ClerkProvider
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/"
            signUpFallbackRedirectUrl="/"
          >
            <ConvexClientProvider>{tree}</ConvexClientProvider>
          </ClerkProvider>
        ) : tree}
      </body>
    </html>
  );
}

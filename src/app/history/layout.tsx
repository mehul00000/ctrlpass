import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/** Server-side gate: watch history requires a signed-in account. */
export default async function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in?redirect=%2Fhistory");
  }
  return <>{children}</>;
}

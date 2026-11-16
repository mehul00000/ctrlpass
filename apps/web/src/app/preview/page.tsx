"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Facebook, Github, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import Button from "@/components/ui/Button";
import { EventCountdownCard } from "@/components/ui/event-countdown-card";
import AdmitOneTicket from "@/components/ui/admit-one-ticket";
import { AnimatedTicket } from "@/components/ui/ticket-confirmation-card";
import { PillBase } from "@/components/ui/3d-adaptive-navigation-bar";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import PricingSection5 from "@/components/ui/pricing";
import PricingSection2 from "@/components/ui/pricing-section-1";
import RuixenPaymentCard from "@/components/ui/modern-payment-form";
import { SeatSelection, type SeatCategoryInfo, type SeatInfo } from "@/components/ui/seat-selection";
import { TeamSection } from "@/components/ui/team-section-1";
import { GlassForm } from "@/components/ui/glass-form";
import { UiloraGlassPricingCard } from "@/components/ui/uilora-glass-pricing-card";
import { UiloraMusicCard } from "@/components/ui/uilora-music-card";
import UiloraGrid from "@/components/ui/uilora-grid";
import ClassicBadges from "@/components/ui/classic-badges";
import { VelocityScroll } from "@/components/ui/velocity-scroll";
import UiloraTriloe from "@/components/ui/uilora-triloe";
import { QuantumUpload } from "@/components/ui/quantum-upload";
import { OTPVerification } from "@/components/ui/otp-verification";
import ProfileAvatarsPage from "@/components/ui/profile-avatars";
import TeamAvatarsPage from "@/components/ui/team-avatars";
import GlassSelectors from "@/components/ui/glass-selectors";
import { LiquidEventHorizonFooter } from "@/components/ui/liquid-event-horizon-footer";

// --- Seat-selection demo data ---
const gen = (row: string, start: number, end: number): SeatInfo[] =>
  Array.from({ length: end - start + 1 }, (_, i) => ({ id: `${row}${start + i}`, number: start + i }));

const seatLayout: SeatCategoryInfo[] = [
  {
    categoryName: "CLASSIC",
    price: 135.58,
    rows: [
      { rowId: "A", seats: [...gen("A", 1, 9), { id: "A-sp", isSpacer: true }, ...gen("A", 10, 21)] },
      { rowId: "B", seats: [...gen("B", 1, 9), { id: "B-sp", isSpacer: true }, ...gen("B", 10, 21)] },
      { rowId: "C", seats: [...gen("C", 1, 9), { id: "C-sp", isSpacer: true }, ...gen("C", 10, 21)] },
    ],
  },
  {
    categoryName: "PRIME",
    price: 186.44,
    rows: [
      { rowId: "J", seats: [...gen("J", 1, 13), { id: "J-sp", isSpacer: true }, ...gen("J", 14, 25)] },
      { rowId: "K", seats: [...gen("K", 1, 13), { id: "K-sp", isSpacer: true }, ...gen("K", 14, 25)] },
    ],
  },
];

const teamMembers = [
  {
    name: "EMMA",
    designation: "Product Designer",
    imageSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    socialLinks: [
      { icon: Twitter, href: "#" },
      { icon: Linkedin, href: "#" },
    ],
  },
  {
    name: "HENRY",
    designation: "Lead Developer",
    imageSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    socialLinks: [
      { icon: Github, href: "#" },
      { icon: Twitter, href: "#" },
    ],
  },
  {
    name: "JOHN",
    designation: "Marketing Specialist",
    imageSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    socialLinks: [
      { icon: Facebook, href: "#" },
      { icon: Instagram, href: "#" },
    ],
  },
];

export default function PreviewPage() {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const occupiedSeats = useMemo(() => ["J17", "J18", "J19", "C1", "C2"], []);

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  };

  const totalPrice = useMemo(
    () =>
      selectedSeats.reduce((total, seatId) => {
        for (const category of seatLayout) {
          if (category.rows.some((row) => row.seats.some((seat) => seat.id === seatId))) {
            return total + category.price;
          }
        }
        return total;
      }, 0),
    [selectedSeats]
  );

  const sortedSelected = [...selectedSeats].sort();

  return (
    <main className="bg-background text-foreground">
      <section className="flex items-center justify-center bg-white py-10">
        <PillBase />
      </section>

      <section className="flex items-center justify-center py-10">
        <EventCountdownCard />
      </section>

      <section className="flex min-h-[640px] items-center justify-center overflow-x-auto rounded-2xl bg-[#281d14] p-8">
        <AdmitOneTicket
          name="Garry Tan"
          presenter="Y Combinator presents"
          event="Startup School 2026"
          venue="Chase Center, SF"
          dates="July 25–26"
          stubText="Admit one"
          watermark="2026"
          width={741}
        />
      </section>

      <section className="flex items-center justify-center overflow-x-auto p-8">
        <AnimatedTicket
          ticketId="0120034399434"
          amount={305.5}
          date={new Date("2025-06-19T10:15:00")}
          cardHolder="Liana80 Tudakova"
          last4Digits="8237"
          barcodeValue="28937261273650"
        />
      </section>

      <section className="bg-neutral-100 text-gray-900">
        <PricingSection5 />
      </section>

      <section className="bg-neutral-100 text-gray-900">
        <PricingSection2 />
      </section>

      <section className="py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold">Payment</h2>
        <RuixenPaymentCard />
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold">Seat selection</h2>
        <SeatSelection
          layout={seatLayout}
          selectedSeats={selectedSeats}
          occupiedSeats={occupiedSeats}
          onSeatSelect={handleSeatSelect}
        />
        <AnimatePresence>
          {selectedSeats.length > 0 && (
            <motion.div
              className="mx-auto mt-8 w-full max-w-md rounded-lg border bg-card p-4 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="mb-2 text-lg font-semibold text-foreground">Your Selection</h3>
              <div className="mb-4 flex flex-wrap gap-2">
                {sortedSelected.map((seatId) => (
                  <span
                    key={seatId}
                    className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                  >
                    {seatId}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-medium text-muted-foreground">Total Price:</span>
                <span className="text-xl font-bold text-foreground">
                  {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(totalPrice)}
                  <span className="text-xs font-normal text-muted-foreground"> + GST</span>
                </span>
              </div>
              <Button className="mt-4 w-full">Proceed to Payment</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <TeamSection
        title="EVENT CREW"
        description="The team behind CtrlPass events — organizers, designers, and engineers who make every show happen. Admins can add crew members and their pictures from the organizer dashboard."
        members={teamMembers}
        registerLink="#"
        logo="CTRLPASS"
        socialLinksMain={[
          { icon: Twitter, href: "#" },
          { icon: Facebook, href: "#" },
          { icon: Instagram, href: "#" },
          { icon: Youtube, href: "#" },
        ]}
      />

      <CinematicHero />

      {/* --- Uilora component batch --- */}
      <section className="flex min-h-[70vh] items-center justify-center bg-zinc-950 p-8">
        <div className="grid gap-10 md:grid-cols-3">
          <UiloraGlassPricingCard />
          <UiloraMusicCard />
          <div className="w-80">
            <QuantumUpload />
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-zinc-950 p-8">
        <OTPVerification />
      </section>

      <section className="flex items-center justify-center bg-black p-8">
        <GlassForm />
      </section>

      <section className="py-10">
        <ClassicBadges compact />
      </section>

      <section className="py-10">
        <GlassSelectors compact />
      </section>

      <section className="bg-white">
        <UiloraGrid />
      </section>

      <section>
        <UiloraTriloe />
      </section>

      <section className="h-[60vh]">
        <VelocityScroll />
      </section>

      <section>
        <ProfileAvatarsPage />
      </section>

      <section>
        <TeamAvatarsPage />
      </section>

      <LiquidEventHorizonFooter />
    </main>
  );
}

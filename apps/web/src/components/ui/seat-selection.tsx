"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SeatInfo {
  id: string;
  number?: number;
  isSpacer?: boolean;
}

export interface SeatRowInfo {
  rowId: string;
  seats: SeatInfo[];
}

export interface SeatCategoryInfo {
  categoryName: string;
  price: number;
  rows: SeatRowInfo[];
}

interface SeatSelectionProps {
  layout: SeatCategoryInfo[];
  selectedSeats: string[];
  occupiedSeats: string[];
  onSeatSelect: (seatId: string) => void;
  className?: string;

  /**
   * Maximum number of seats that can be selected.
   * Usually this should match the ticket quantity.
   */
  maxSelectableSeats?: number;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const Screen = () => (
  <div className="relative mb-12 flex w-full items-center justify-center">
    <motion.div
      className="h-10 w-full max-w-2xl border-b-2 border-[#D6B47A]/70"
      style={{
        borderBottomLeftRadius: "50%",
        borderBottomRightRadius: "50%",
        boxShadow: "0 18px 35px -12px rgba(214,180,122,0.28)",
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    />

    <motion.span
      className="absolute -bottom-7 font-mono text-[9px] font-medium uppercase tracking-[0.25em] text-[#77736C]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.5 }}
    >
      Screen
    </motion.span>
  </div>
);

interface SeatProps {
  seat: SeatInfo;
  status: "available" | "selected" | "occupied" | "limit-reached";
  onSelect: (id: string) => void;
}

const Seat = React.memo(
  ({ seat, status, onSelect }: SeatProps) => {
    if (seat.isSpacer) {
      return (
        <div
          className="h-8 w-8 md:h-10 md:w-10"
          aria-hidden="true"
        />
      );
    }

    const isOccupied = status === "occupied";
    const isLimitReached = status === "limit-reached";
    const isDisabled = isOccupied || isLimitReached;

    return (
      <motion.button
        type="button"
        onClick={() => {
          if (!isDisabled) {
            onSelect(seat.id);
          }
        }}
        disabled={isDisabled}
        aria-label={`Seat ${seat.id}, ${status}`}
        aria-pressed={status === "selected"}
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-[10px] font-semibold transition-all duration-200 md:h-10 md:w-10 md:text-xs",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]",
          {
            "cursor-pointer border-white/[0.10] bg-[#111111] text-[#A7A39B] hover:-translate-y-0.5 hover:border-[#D6B47A]/40 hover:bg-[#D6B47A]/[0.06] hover:text-[#D6B47A]":
              status === "available",

            "cursor-pointer border-[#D6B47A] bg-[#D6B47A] text-[#050505] shadow-lg shadow-[#D6B47A]/10":
              status === "selected",

            "cursor-not-allowed border-white/[0.04] bg-white/[0.025] text-[#55524D]":
              status === "occupied",

            "cursor-not-allowed border-white/[0.04] bg-[#0A0A0A] text-[#4B4843] opacity-50":
              status === "limit-reached",
          },
        )}
        whileHover={
          isDisabled
            ? undefined
            : {
                scale: 1.08,
                y: -2,
              }
        }
        whileTap={isDisabled ? undefined : { scale: 0.92 }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 22,
        }}
      >
        {status === "selected" ? (
          <Check className="h-4 w-4" strokeWidth={2.5} />
        ) : status === "occupied" ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          seat.number
        )}
      </motion.button>
    );
  },
);

Seat.displayName = "Seat";

export const SeatSelection = ({
  layout,
  selectedSeats,
  occupiedSeats,
  onSeatSelect,
  className,
  maxSelectableSeats,
}: SeatSelectionProps) => {
  const selectedCount = selectedSeats.length;

  const totalSelectableSeats = layout.reduce(
    (total, category) =>
      total +
      category.rows.reduce(
        (rowTotal, row) =>
          rowTotal +
          row.seats.filter((seat) => !seat.isSpacer).length,
        0,
      ),
    0,
  );

  const maximumSeats = Math.max(
    1,
    Math.min(
      maxSelectableSeats ?? totalSelectableSeats,
      totalSelectableSeats,
    ),
  );

  const selectionComplete = selectedCount >= maximumSeats;

  const getSeatStatus = (
    seatId: string,
  ): "available" | "selected" | "occupied" | "limit-reached" => {
    if (occupiedSeats.includes(seatId)) {
      return "occupied";
    }

    if (selectedSeats.includes(seatId)) {
      return "selected";
    }

    if (selectionComplete) {
      return "limit-reached";
    }

    return "available";
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-8 rounded-2xl border border-white/[0.06] bg-[#080808] p-4 sm:p-6 md:p-8",
        className,
      )}
    >
      <div className="w-full max-w-3xl">
        <Screen />

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-y border-white/[0.06] py-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#77736C]">
              Seat Selection
            </p>

            <p className="mt-1 text-sm font-medium text-[#F5F5F2]">
              {selectedCount} of {maximumSeats} seats selected
            </p>
          </div>

          <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-wider">
            <div className="flex items-center gap-1.5 text-[#77736C]">
              <span className="h-2.5 w-2.5 rounded-md border border-white/[0.12] bg-[#111111]" />
              Available
            </div>

            <div className="flex items-center gap-1.5 text-[#D6B47A]">
              <span className="h-2.5 w-2.5 rounded-md bg-[#D6B47A]" />
              Selected
            </div>

            <div className="flex items-center gap-1.5 text-[#55524D]">
              <span className="h-2.5 w-2.5 rounded-md bg-white/[0.025]" />
              Occupied
            </div>
          </div>
        </div>

        {selectionComplete && (
          <div className="mb-6 rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/[0.05] px-4 py-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#D6B47A]">
              Selection complete
            </p>
            <p className="mt-1 text-xs text-[#77736C]">
              You have selected the required number of seats.
            </p>
          </div>
        )}

        <motion.div
          className="flex w-full flex-col gap-8"
          initial="hidden"
          animate="visible"
        >
          {layout.map((category) => (
            <div
              key={category.categoryName}
              className="flex flex-col items-center gap-4"
            >
              <div className="text-center">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-[#F5F5F2]">
                  {category.categoryName}
                </h3>

                <p className="mt-1 font-mono text-[10px] text-[#77736C]">
                  {formatINR(category.price)} + GST
                </p>
              </div>

              <div className="w-full overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#0B0B0B] p-3 sm:p-5">
                <div className="min-w-[420px] space-y-2">
                  {category.rows.map((row) => (
                    <motion.div
                      key={row.rowId}
                      className="flex items-center justify-center gap-2"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.35,
                        ease: "easeOut",
                      }}
                    >
                      <div className="w-6 shrink-0 select-none text-center font-mono text-[10px] font-medium text-[#77736C]">
                        {row.rowId}
                      </div>

                      <div className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2">
                        {row.seats.map((seat) => (
                          <Seat
                            key={seat.id}
                            seat={seat}
                            onSelect={onSeatSelect}
                            status={getSeatStatus(seat.id)}
                          />
                        ))}
                      </div>

                      <div className="w-6 shrink-0 select-none text-center font-mono text-[10px] font-medium text-[#77736C]">
                        {row.rowId}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
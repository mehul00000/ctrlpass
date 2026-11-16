import React from 'react';

interface PriceBreakdownProps {
  tierName: string;
  quantity: number;
  subtotalMinor: number;
  bookingFeeMinor: number;
  taxMinor: number;
  totalMinor: number;
  isFree?: boolean;
}

export default function PriceBreakdown({
  tierName,
  quantity,
  subtotalMinor,
  bookingFeeMinor,
  taxMinor,
  totalMinor,
  isFree = false,
}: PriceBreakdownProps) {
  const formatINR = (minor: number) => `₹${(minor / 100).toFixed(2)}`;

  return (
    <div className="space-y-3 border-t border-white/[0.07] pt-4 text-xs">
      <div className="flex items-center justify-between text-[#A7A39B]">
        <span className="truncate pr-2">
          {tierName}{' '}
          <span className="font-mono text-[#77736C]">
            × {quantity}
          </span>
        </span>

        <span className="font-mono font-medium text-[#F5F5F2]">
          {isFree ? 'FREE' : formatINR(subtotalMinor)}
        </span>
      </div>

      {!isFree && (
        <>
          <div className="flex items-center justify-between text-[#77736C]">
            <span>Platform & Payment Fee (2.5%)</span>
            <span className="font-mono text-[#A7A39B]">
              {formatINR(bookingFeeMinor)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[#77736C]">
            <span>GST on Fee (18%)</span>
            <span className="font-mono text-[#A7A39B]">
              {formatINR(taxMinor)}
            </span>
          </div>
        </>
      )}

      <div className="flex items-baseline justify-between border-t border-white/[0.07] pt-3">
        <div>
          <span className="block font-display text-sm font-semibold text-[#F5F5F2]">
            Total Amount
          </span>

          <span className="font-mono text-[10px] text-[#77736C]">
            {isFree
              ? 'No hidden charges'
              : 'All taxes and gateway fees included'}
          </span>
        </div>

        <span className="font-mono text-lg font-extrabold text-[#D6B47A]">
          {isFree ? 'FREE' : formatINR(totalMinor)}
        </span>
      </div>
    </div>
  );
}
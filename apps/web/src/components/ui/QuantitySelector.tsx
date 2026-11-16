import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (newQuantity: number) => void;
  disabled?: boolean;
}

export default function QuantitySelector({
  quantity,
  min = 1,
  max = 10,
  onChange,
  disabled = false,
}: QuantitySelectorProps) {
  const canDecrease = quantity > min && !disabled;
  const canIncrease = quantity < max && !disabled;

  return (
    <div
      role="group"
      aria-label="Ticket quantity selection"
      className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#0B0B0B] p-3.5"
    >
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#A7A39B]">
        Quantity
      </span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Decrease ticket quantity"
          disabled={!canDecrease}
          onClick={() => onChange(Math.max(min, quantity - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#A7A39B] transition-all hover:border-white/[0.14] hover:bg-[#181818] hover:text-[#F5F5F2] active:scale-95 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/50"
        >
          <Minus className="h-4 w-4" />
        </button>

        <span
          aria-live="polite"
          className="w-8 select-none text-center font-mono text-base font-semibold text-[#F5F5F2]"
        >
          {quantity}
        </span>

        <button
          type="button"
          aria-label="Increase ticket quantity"
          disabled={!canIncrease}
          onClick={() => onChange(Math.min(max, quantity + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-[#111111] text-[#A7A39B] transition-all hover:border-[#D6B47A]/30 hover:bg-[#D6B47A]/[0.06] hover:text-[#D6B47A] active:scale-95 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
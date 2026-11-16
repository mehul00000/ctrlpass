import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-[#D6B47A]/50 focus:ring-offset-2 focus:ring-offset-[#050505]',
  {
    variants: {
      variant: {
        default:
          'border-[#D6B47A]/20 bg-[#D6B47A]/[0.07] text-[#D6B47A] hover:bg-[#D6B47A]/[0.10]',

        secondary:
          'border-white/[0.08] bg-white/[0.04] text-[#A7A39B] hover:bg-white/[0.07]',

        destructive:
          'border-[#D96B6B]/20 bg-[#D96B6B]/[0.07] text-[#D96B6B] hover:bg-[#D96B6B]/[0.11]',

        outline:
          'border-white/[0.12] bg-transparent text-[#A7A39B] hover:border-[#D6B47A]/30 hover:text-[#F5F5F2]',
      },
    },

    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
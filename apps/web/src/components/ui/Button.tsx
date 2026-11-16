import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cva } from 'class-variance-authority';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center select-none rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';

    const sizeStyles = {
      sm: 'min-h-[36px] gap-1.5 px-3 py-1.5 text-xs',
      md: 'min-h-[44px] gap-2 px-4 py-2.5 text-sm',
      lg: 'min-h-[50px] gap-2.5 px-6 py-3.5 text-base font-semibold',
    }[size];

    const variantStyles = {
      primary:
        'bg-[#D6B47A] text-[#050505] font-semibold hover:bg-[#E0C38E] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#D6B47A]/10',
      secondary:
        'border border-white/[0.08] bg-[#111111] text-[#F5F5F2] hover:border-white/[0.14] hover:bg-[#181818]',
      outline:
        'border border-[#D6B47A]/25 bg-transparent text-[#D6B47A] hover:border-[#D6B47A]/45 hover:bg-[#D6B47A]/[0.06]',
      ghost:
        'bg-transparent text-[#A7A39B] hover:bg-white/[0.04] hover:text-[#F5F5F2]',
      danger:
        'border border-[#D96B6B]/20 bg-[#D96B6B]/[0.07] text-[#D96B6B] hover:border-[#D96B6B]/35 hover:bg-[#D96B6B]/[0.11]',
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}

        <span>{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[#D6B47A] text-[#050505] hover:bg-[#E0C38E] hover:shadow-lg hover:shadow-[#D6B47A]/10',
        destructive:
          'bg-[#D96B6B] text-[#050505] hover:bg-[#E27B7B]',
        outline:
          'border border-[#D6B47A]/25 bg-transparent text-[#D6B47A] hover:border-[#D6B47A]/45 hover:bg-[#D6B47A]/[0.06]',
        secondary:
          'border border-white/[0.08] bg-[#111111] text-[#F5F5F2] hover:border-white/[0.14] hover:bg-[#181818]',
        ghost:
          'bg-transparent text-[#A7A39B] hover:bg-white/[0.04] hover:text-[#F5F5F2]',
        link:
          'text-[#D6B47A] underline-offset-4 hover:text-[#E0C38E] hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-xl px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
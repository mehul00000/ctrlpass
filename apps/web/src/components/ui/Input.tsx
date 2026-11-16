import React, { forwardRef } from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', id, ...props }, ref) => {
    const inputId =
      id ||
      (label
        ? label.toLowerCase().replace(/\s+/g, '-')
        : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#A7A39B]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-[#77736C]">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl border bg-[#111111] py-3 text-sm text-[#F5F5F2] outline-none transition-all placeholder:text-[#55524D] ${
              icon ? 'pl-10' : 'px-4'
            } pr-4 ${
              error
                ? 'border-[#D96B6B]/50 bg-[#D96B6B]/[0.05] focus:border-[#D96B6B]/70 focus:ring-2 focus:ring-[#D96B6B]/10'
                : 'border-white/[0.08] hover:border-white/[0.14] focus:border-[#D6B47A]/45 focus:ring-2 focus:ring-[#D6B47A]/10'
            } ${className}`}
            {...props}
          />
        </div>

        {error && (
          <p className="text-xs font-medium text-[#D96B6B]">
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-xs text-[#77736C]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
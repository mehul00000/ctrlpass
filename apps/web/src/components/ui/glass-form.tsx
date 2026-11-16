"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useState } from "react";

interface GlassFormProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  fields?: Array<{ placeholder: string; type?: string }>;
  buttonText?: string;
  onSubmit?: (data: Record<string, string>) => void;
  maxWidth?: string;

  // Preserved API for backwards compatibility.
  backgroundGradientFrom?: string;
  backgroundGradientVia?: string;
  backgroundGradientTo?: string;
  blob1Color?: string;
  blob2Color?: string;
  blob3Color?: string;
  blobSize?: string;
  blobBlur?: string;
  cardBgColor?: string;
  cardBorderColor?: string;
  iconBgColor?: string;
  iconColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  inputBgColor?: string;
  inputBorderColor?: string;
  inputFocusBgColor?: string;
  inputFocusBorderColor?: string;
  inputTextColor?: string;
  inputPlaceholderColor?: string;
  buttonGradientFrom?: string;
  buttonGradientTo?: string;
  buttonTextColor?: string;
  buttonBorderColor?: string;
  buttonShadowColor?: string;
  shimmerColor?: string;
  className?: string;
}

const BLOB_BLUR_PX: Record<string, number> = {
  sm: 8,
  md: 16,
  lg: 32,
  xl: 40,
  "2xl": 48,
  "3xl": 64,
};

export const GlassForm: React.FC<GlassFormProps> = ({
  title = "Secure Access",
  subtitle = "Enter your credentials to continue.",
  icon = <Lock className="h-5 w-5" />,
  fields = [
    { placeholder: "Email", type: "email" },
    { placeholder: "Password", type: "password" },
  ],
  buttonText = "Authenticate",
  onSubmit,
  maxWidth = "28rem",

  // Kept for API compatibility with existing callers.
  backgroundGradientFrom: _backgroundGradientFrom,
  backgroundGradientVia: _backgroundGradientVia,
  backgroundGradientTo: _backgroundGradientTo,
  blob1Color: _blob1Color,
  blob2Color: _blob2Color,
  blob3Color: _blob3Color,
  blobSize: _blobSize,
  blobBlur: _blobBlur,
  cardBgColor: _cardBgColor,
  cardBorderColor: _cardBorderColor,
  iconBgColor: _iconBgColor,
  iconColor: _iconColor,
  titleColor: _titleColor,
  subtitleColor: _subtitleColor,
  inputBgColor: _inputBgColor,
  inputBorderColor: _inputBorderColor,
  inputFocusBgColor: _inputFocusBgColor,
  inputFocusBorderColor: _inputFocusBorderColor,
  inputTextColor: _inputTextColor,
  inputPlaceholderColor: _inputPlaceholderColor,
  buttonGradientFrom: _buttonGradientFrom,
  buttonGradientTo: _buttonGradientTo,
  buttonTextColor: _buttonTextColor,
  buttonBorderColor: _buttonBorderColor,
  buttonShadowColor: _buttonShadowColor,
  shimmerColor: _shimmerColor,

  className = "",
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <div
      className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050505] p-4 ${className}`}
    >
      {/* Ambient depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#D6B47A]/[0.045] blur-3xl"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#D6B47A]/[0.035] blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          ease: "easeOut",
        }}
        className="relative z-10 w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0B0B0B] shadow-2xl shadow-black/50"
        style={{ maxWidth }}
      >
        {/* Top accent */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D6B47A]/70 to-transparent" />

        <div className="p-7 sm:p-9">
          <div className="mb-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08, duration: 0.3 }}
              className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D6B47A]/20 bg-[#D6B47A]/[0.07] text-[#D6B47A]"
            >
              {icon}
            </motion.div>

            <h2 className="font-display text-2xl font-semibold tracking-tight text-[#F5F5F2]">
              {title}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-[#77736C]">
              {subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map((field, index) => (
              <motion.div
                key={`${field.placeholder}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.1 + index * 0.05,
                  duration: 0.3,
                }}
              >
                <label className="mb-2 block font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-[#77736C]">
                  {field.placeholder}
                </label>

                <input
                  type={field.type || "text"}
                  value={formData[field.placeholder] || ""}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      [field.placeholder]: event.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#111111] px-4 text-sm text-[#F5F5F2] outline-none transition-all placeholder:text-[#55524D] hover:border-white/[0.12] focus:border-[#D6B47A]/50 focus:bg-[#151515] focus:ring-2 focus:ring-[#D6B47A]/10"
                />
              </motion.div>
            ))}

            <motion.button
              type="submit"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-[#D6B47A]/30 bg-[#D6B47A] px-5 text-sm font-semibold text-[#050505] transition-all duration-200 hover:bg-[#E2C58F] hover:shadow-lg hover:shadow-[#D6B47A]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B47A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0B]"
            >
              {buttonText}
            </motion.button>
          </form>
        </div>

        <div className="border-t border-white/[0.06] px-7 py-4 text-center sm:px-9">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#55524D]">
            CtrlPass secure access
          </span>
        </div>
      </motion.div>
    </div>
  );
};
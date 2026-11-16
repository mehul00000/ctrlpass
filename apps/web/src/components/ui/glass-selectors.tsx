"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cloud,
  Droplets,
  Flame,
  Moon,
  Snowflake,
  Sun,
  Sunset,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GlassSelectorsProps {
  theme?: "dark" | "light";
  compact?: boolean;
  accentColor?: string;
}

const darkTheme = {
  bg: "bg-[#050505]",
  text: "text-[#F5F5F2]",
  cardBg: "border-white/[0.07]",
  cardTitle: "text-[#77736C]",
  sectionTitle: "text-[#A7A39B]",
  sectionBorder: "border-white/[0.07]",
  eyebrow: "text-[#77736C]",
  heading: "text-[#F5F5F2]",
  subheading: "text-[#77736C]",
};

const lightTheme = {
  bg: "bg-[#F4F3EF]",
  text: "text-[#171614]",
  cardBg: "border-black/[0.08]",
  cardTitle: "text-[#77736C]",
  sectionTitle: "text-[#5F5B54]",
  sectionBorder: "border-black/[0.08]",
  eyebrow: "text-[#77736C]",
  heading: "text-[#171614]",
  subheading: "text-[#77736C]",
};

const CHAMPAGNE = "#D6B47A";
const GOLD = "#B88A45";

interface GlassCardProps {
  title: string;
  children: React.ReactNode;
  cardTitle: string;
  isDark: boolean;
}

const GlassCard = ({
  title,
  children,
  cardTitle,
  isDark,
}: GlassCardProps) => (
  <div
    className="relative overflow-hidden rounded-2xl border p-6"
    style={{
      background: isDark
        ? "linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))"
        : "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,255,255,0.58))",
      borderColor: isDark
        ? "rgba(255,255,255,0.07)"
        : "rgba(0,0,0,0.08)",
      backdropFilter: "blur(20px)",
      boxShadow: isDark
        ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.35)"
        : "inset 0 1px 0 rgba(255,255,255,0.9), 0 12px 32px rgba(0,0,0,0.06)",
    }}
  >
    <div
      className="absolute inset-x-0 top-0 h-px"
      style={{
        background: isDark
          ? "linear-gradient(90deg, transparent, rgba(214,180,122,0.35), transparent)"
          : "linear-gradient(90deg, transparent, rgba(184,138,69,0.35), transparent)",
      }}
    />

    <h3
      className={cn(
        "mb-5 text-xs font-medium uppercase tracking-widest",
        cardTitle,
      )}
    >
      {title}
    </h3>

    <div className="flex flex-wrap items-start gap-3">{children}</div>
  </div>
);

function FrostedDepth({
  isDark,
  accentColor,
}: {
  isDark: boolean;
  accentColor: string;
}) {
  const [active, setActive] = useState(1);
  const opts = ["Mist", "Frost", "Crystal"];
  const accent = accentColor || CHAMPAGNE;

  return (
    <div
      className="inline-flex rounded-2xl p-1"
      style={{
        background: isDark
          ? "rgba(255,255,255,0.035)"
          : "rgba(0,0,0,0.035)",
        backdropFilter: "blur(16px)",
        border: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(0,0,0,0.08)",
      }}
    >
      {opts.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => setActive(i)}
          className="relative rounded-xl px-5 py-2 text-xs font-medium"
        >
          {active === i && (
            <motion.div
              layoutId="frost-active"
              className="absolute inset-0 rounded-xl"
              style={{
                background: isDark
                  ? `linear-gradient(145deg, ${accent}22, rgba(255,255,255,0.035))`
                  : `linear-gradient(145deg, ${accent}18, rgba(255,255,255,0.7))`,
                boxShadow: isDark
                  ? `inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px ${accent}22`
                  : `inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px rgba(0,0,0,0.06), 0 0 0 1px ${accent}28`,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 35,
              }}
            />
          )}

          <span
            className="relative z-10 transition-colors duration-300"
            style={{
              color:
                active === i
                  ? isDark
                    ? "#F5F5F2"
                    : "#171614"
                  : isDark
                    ? "rgba(245,245,242,0.28)"
                    : "rgba(23,22,20,0.35)",
            }}
          >
            {opt}
          </span>
        </button>
      ))}
    </div>
  );
}

function LiquidMorph({
  isDark,
  accentColor,
}: {
  isDark: boolean;
  accentColor: string;
}) {
  const [active, setActive] = useState(0);
  const opts = ["Surface", "Depth", "Void", "Abyss"];
  const accent = accentColor || CHAMPAGNE;

  return (
    <div
      className="inline-flex gap-0.5 rounded-full p-1"
      style={{
        background: isDark
          ? "rgba(255,255,255,0.03)"
          : "rgba(0,0,0,0.035)",
        border: isDark
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid rgba(0,0,0,0.08)",
      }}
    >
      {opts.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => setActive(i)}
          className="relative rounded-full px-4 py-1.5 text-xs font-semibold"
        >
          {active === i && (
            <motion.div
              layoutId="liquid-bg"
              className="absolute inset-0 rounded-full"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${accent}28, ${accent}0d)`
                  : `linear-gradient(135deg, ${accent}20, ${accent}08)`,
                boxShadow: `0 0 20px -4px ${accent}38, inset 0 1px 0 rgba(255,255,255,0.22)`,
              }}
              transition={{
                type: "spring",
                stiffness: 600,
                damping: 22,
              }}
            />
          )}

          <span
            className="relative z-10 transition-colors duration-200"
            style={{
              color:
                active === i
                  ? isDark
                    ? "#F5F5F2"
                    : "#171614"
                  : isDark
                    ? "rgba(245,245,242,0.24)"
                    : "rgba(23,22,20,0.32)",
            }}
          >
            {opt}
          </span>
        </button>
      ))}
    </div>
  );
}

function MirrorSweep({
  isDark,
  accentColor,
}: {
  isDark: boolean;
  accentColor: string;
}) {
  const [active, setActive] = useState(1);
  const [sweeping, setSweeping] = useState(false);
  const opts = ["Obsidian", "Smoke", "Pearl", "Chalk"];
  const accent = accentColor || CHAMPAGNE;

  const handleClick = (index: number) => {
    setActive(index);
    setSweeping(true);

    window.setTimeout(() => {
      setSweeping(false);
    }, 600);
  };

  return (
    <div
      className="flex flex-col gap-px overflow-hidden rounded-xl"
      style={{
        background: isDark
          ? "rgba(255,255,255,0.02)"
          : "rgba(0,0,0,0.035)",
        border: isDark
          ? "1px solid rgba(255,255,255,0.05)"
          : "1px solid rgba(0,0,0,0.08)",
      }}
    >
      {opts.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => handleClick(i)}
          className="group relative overflow-hidden px-5 py-3 text-left text-xs font-medium transition-colors duration-200"
          style={{
            color:
              active === i
                ? isDark
                  ? "#F5F5F2"
                  : "#171614"
                : isDark
                  ? "rgba(245,245,242,0.28)"
                  : "rgba(23,22,20,0.35)",
          }}
        >
          {active === i && (
            <>
              <motion.div
                layoutId="mirror-bg"
                className="absolute inset-0"
                style={{
                  background: isDark
                    ? `linear-gradient(90deg, ${accent}12, rgba(255,255,255,0.025))`
                    : `linear-gradient(90deg, ${accent}12, rgba(255,255,255,0.65))`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 35,
                }}
              />

              <AnimatePresence>
                {sweeping && (
                  <motion.div
                    className="absolute inset-y-0 w-16"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${accent}45, transparent)`,
                    }}
                    initial={{ left: "-4rem" }}
                    animate={{ left: "100%" }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                  />
                )}
              </AnimatePresence>
            </>
          )}

          <span className="relative z-10">{opt}</span>
        </button>
      ))}
    </div>
  );
}

function PrismEdge({
  isDark,
  accentColor,
}: {
  isDark: boolean;
  accentColor: string;
}) {
  const [active, setActive] = useState(0);
  const [rotation, setRotation] = useState(0);
  const opts = ["Refract", "Scatter", "Diffuse"];
  const accent = accentColor || CHAMPAGNE;

  useEffect(() => {
    const id = window.setInterval(() => {
      setRotation((current) => (current + 1.2) % 360);
    }, 16);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex gap-3">
      {opts.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => setActive(i)}
          className="relative rounded-2xl p-px text-xs font-semibold transition-all"
          style={{
            background:
              active === i
                ? `conic-gradient(from ${rotation}deg, ${accent}, ${GOLD}, ${accent}, ${accent})`
                : isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.08)",
          }}
        >
          <div
            className="relative flex items-center justify-center rounded-[14px] px-4 py-2.5"
            style={{
              background: isDark ? "#0B0B0B" : "#F4F3EF",
              color:
                active === i
                  ? isDark
                    ? "#F5F5F2"
                    : "#171614"
                  : isDark
                    ? "rgba(245,245,242,0.3)"
                    : "rgba(23,22,20,0.35)",
            }}
          >
            {opt}
          </div>
        </button>
      ))}
    </div>
  );
}

function IceTiles({
  isDark,
  accentColor,
}: {
  isDark: boolean;
  accentColor: string;
}) {
  const [active, setActive] = useState(0);
  const accent = accentColor || CHAMPAGNE;

  const opts = [
    { label: "Glacial", icon: Snowflake },
    { label: "Vapour", icon: Cloud },
    { label: "Flame", icon: Flame },
    { label: "Torrent", icon: Droplets },
  ];

  return (
    <div className="flex w-full flex-col gap-1.5">
      {opts.map(({ label, icon: Icon }, i) => (
        <motion.button
          key={label}
          type="button"
          onClick={() => setActive(i)}
          whileTap={{ scale: 0.98 }}
          className="relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-left text-xs font-medium transition-colors duration-300"
          style={
            active === i
              ? {
                  background: isDark
                    ? `linear-gradient(90deg, ${accent}18, rgba(255,255,255,0.025))`
                    : `linear-gradient(90deg, ${accent}14, rgba(255,255,255,0.7))`,
                  border: isDark
                    ? `1px solid ${accent}30`
                    : `1px solid ${accent}38`,
                  boxShadow: isDark
                    ? "inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 16px rgba(0,0,0,0.25)"
                    : "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px rgba(0,0,0,0.05)",
                  color: isDark ? "#F5F5F2" : "#171614",
                }
              : {
                  background: "transparent",
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "1px solid rgba(0,0,0,0.05)",
                  color: isDark
                    ? "rgba(245,245,242,0.25)"
                    : "rgba(23,22,20,0.3)",
                }
          }
        >
          {active === i && (
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(105deg, transparent 30%, ${accent}14 50%, transparent 70%)`,
              }}
              animate={{ x: ["0%", "200%"] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 1,
              }}
            />
          )}

          <Icon
            className="relative z-10 h-4 w-4 shrink-0 transition-all duration-300"
            strokeWidth={active === i ? 1.5 : 1}
            style={{
              color: active === i ? accent : undefined,
              opacity: active === i ? 1 : 0.3,
            }}
          />

          <span className="relative z-10">{label}</span>
        </motion.button>
      ))}
    </div>
  );
}

function GlassOrb({
  isDark,
  accentColor,
}: {
  isDark: boolean;
  accentColor: string;
}) {
  const [active, setActive] = useState(1);
  const accent = accentColor || CHAMPAGNE;

  const opts = [
    { label: "Dawn", icon: Sunset },
    { label: "Noon", icon: Sun },
    { label: "Dusk", icon: Wind },
    { label: "Night", icon: Moon },
  ];

  return (
    <div className="flex gap-4">
      {opts.map(({ label, icon: Icon }, i) => (
        <button
          key={label}
          type="button"
          onClick={() => setActive(i)}
          className="flex flex-col items-center gap-2"
        >
          <motion.div
            className="relative flex h-11 w-11 items-center justify-center rounded-full"
            animate={active === i ? { scale: 1.08 } : { scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            style={
              active === i
                ? {
                    background: isDark
                      ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.24), ${accent}38 40%, ${accent}0d 100%)`
                      : `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), ${accent}30 50%, ${accent}12 100%)`,
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.18)"
                      : "1px solid rgba(0,0,0,0.08)",
                    boxShadow: isDark
                      ? `0 8px 24px -4px ${accent}30, inset 0 -2px 4px rgba(0,0,0,0.2)`
                      : `0 8px 24px -4px ${accent}25, inset 0 -2px 4px rgba(0,0,0,0.05)`,
                  }
                : {
                    background: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.035)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "1px solid rgba(0,0,0,0.07)",
                  }
            }
          >
            {active === i && (
              <div
                className="absolute left-2 top-1.5 h-2.5 w-2 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.85), transparent)",
                  filter: "blur(2px)",
                }}
              />
            )}

            <Icon
              className="relative z-10 h-4 w-4 transition-all duration-300"
              strokeWidth={active === i ? 1.5 : 1}
              style={{
                color:
                  active === i
                    ? isDark
                      ? "#F5F5F2"
                      : "#171614"
                    : isDark
                      ? "rgba(245,245,242,0.25)"
                      : "rgba(23,22,20,0.25)",
              }}
            />
          </motion.div>

          <span
            className="text-[10px] font-medium transition-colors duration-300"
            style={{
              color:
                active === i
                  ? isDark
                    ? "rgba(245,245,242,0.7)"
                    : "#171614"
                  : isDark
                    ? "rgba(245,245,242,0.2)"
                    : "rgba(23,22,20,0.25)",
            }}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

function VaporTrail({
  isDark,
  accentColor,
}: {
  isDark: boolean;
  accentColor: string;
}) {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const accent = accentColor || CHAMPAGNE;

  const opts = ["Alpha", "Beta", "Gamma", "Delta"];

  const handleClick = (index: number) => {
    setPrev(active);
    setActive(index);

    window.setTimeout(() => {
      setPrev(null);
    }, 500);
  };

  return (
    <div
      className="inline-flex gap-0.5 rounded-2xl p-1"
      style={{
        background: isDark
          ? "rgba(255,255,255,0.03)"
          : "rgba(0,0,0,0.035)",
        border: isDark
          ? "1px solid rgba(255,255,255,0.05)"
          : "1px solid rgba(0,0,0,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {opts.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => handleClick(i)}
          className="relative rounded-xl px-4 py-2 text-xs font-semibold"
        >
          <AnimatePresence>
            {prev === i && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: isDark
                    ? `${accent}16`
                    : `${accent}12`,
                }}
                initial={{ opacity: 1, scale: 1 }}
                animate={{
                  opacity: 0,
                  scale: 1.15,
                  filter: "blur(4px)",
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.45,
                  ease: "easeOut",
                }}
              />
            )}
          </AnimatePresence>

          {active === i && (
            <motion.div
              layoutId="vapor-active"
              className="absolute inset-0 rounded-xl"
              style={{
                background: isDark
                  ? `linear-gradient(135deg, ${accent}1f, rgba(255,255,255,0.035))`
                  : `linear-gradient(135deg, ${accent}18, rgba(255,255,255,0.7))`,
                boxShadow: isDark
                  ? `inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 12px rgba(0,0,0,0.2)`
                  : `inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.06)`,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            />
          )}

          <span
            className="relative z-10 transition-colors duration-200"
            style={{
              color:
                active === i
                  ? isDark
                    ? "#F5F5F2"
                    : "#171614"
                  : isDark
                    ? "rgba(245,245,242,0.24)"
                    : "rgba(23,22,20,0.3)",
            }}
          >
            {opt}
          </span>
        </button>
      ))}
    </div>
  );
}

function CondensationRing({
  isDark,
  accentColor,
}: {
  isDark: boolean;
  accentColor: string;
}) {
  const [active, setActive] = useState(2);
  const opts = ["00", "25", "50", "75", "100"];
  const accent = accentColor || CHAMPAGNE;

  return (
    <div className="flex items-end gap-3">
      {opts.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => setActive(i)}
          className="group flex flex-col items-center gap-2"
        >
          <motion.div
            className="relative flex h-10 w-10 items-center justify-center rounded-full"
            animate={active === i ? { scale: 1 } : { scale: 0.85 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
            }}
            style={
              active === i
                ? {
                    background: isDark
                      ? `radial-gradient(circle, ${accent}18, rgba(255,255,255,0.03))`
                      : `radial-gradient(circle, ${accent}15, rgba(255,255,255,0.75))`,
                    boxShadow: isDark
                      ? `0 0 0 1px ${accent}35, 0 0 0 3px ${accent}10, 0 0 0 6px rgba(255,255,255,0.015), 0 8px 20px rgba(0,0,0,0.3)`
                      : `0 0 0 1px ${accent}38, 0 0 0 3px ${accent}15, 0 0 0 6px ${accent}08, 0 8px 20px rgba(0,0,0,0.06)`,
                  }
                : {
                    background: isDark
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(0,0,0,0.025)",
                  }
            }
          >
            <span
              className="font-mono text-[10px] font-bold transition-colors duration-300"
              style={{
                color:
                  active === i
                    ? isDark
                      ? "#F5F5F2"
                      : "#171614"
                    : isDark
                      ? "rgba(245,245,242,0.2)"
                      : "rgba(23,22,20,0.25)",
              }}
            >
              {opt}
            </span>
          </motion.div>

          <div
            className="h-0.5 rounded-full transition-all duration-300"
            style={{
              background: active === i ? accent : "transparent",
              width: active === i ? "16px" : "4px",
            }}
          />
        </button>
      ))}
    </div>
  );
}

const GridContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {children}
  </div>
);

export default function GlassSelectors({
  theme = "dark",
  compact = false,
  accentColor = CHAMPAGNE,
}: GlassSelectorsProps) {
  const t = theme === "dark" ? darkTheme : lightTheme;
  const isDark = theme === "dark";
  const pad = compact ? "p-5" : "p-8";
  const spacing = compact ? "space-y-8" : "space-y-12";

  const accent = accentColor || CHAMPAGNE;

  const card = (title: string, children: React.ReactNode) => (
    <GlassCard
      title={title}
      cardTitle={t.cardTitle}
      isDark={isDark}
    >
      {children}
    </GlassCard>
  );

  return (
    <div
      className={cn(
        "min-h-screen w-full font-sans transition-colors duration-300",
        t.bg,
        t.text,
        pad,
      )}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -left-40 -top-40 h-96 w-96 rounded-full"
          style={{
            background: isDark ? `${accent}10` : `${accent}18`,
            filter: "blur(80px)",
          }}
        />

        <div
          className="absolute -bottom-40 -right-20 h-80 w-80 rounded-full"
          style={{
            background: isDark ? `${GOLD}08` : `${GOLD}12`,
            filter: "blur(80px)",
          }}
        />

        <div
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: isDark ? `${accent}06` : `${accent}08`,
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className={cn("relative mx-auto max-w-6xl", spacing)}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
                t.eyebrow,
              )}
            >
              CtrlPass
            </span>

            <span className={cn("text-[10px]", t.eyebrow)}>·</span>

            <span
              className={cn(
                "font-mono text-[10px] font-medium uppercase tracking-[0.12em]",
                t.eyebrow,
              )}
            >
              Selector System
            </span>
          </div>

          <h1
            className={cn(
              "font-display text-3xl font-light tracking-tight",
              t.heading,
            )}
          >
            Glass Selectors
          </h1>

          <p className={cn("text-sm", t.subheading)}>
            Layered selectors with responsive depth, spring physics, and
            controlled material light.
          </p>
        </div>

        {!compact && (
          <section>
            <h2
              className={cn(
                "mb-6 border-b pb-2 text-sm font-semibold",
                t.sectionTitle,
                t.sectionBorder,
              )}
            >
              01 — Surface &amp; Depth
            </h2>

            <GridContainer>
              {card(
                "Frosted Depth",
                <FrostedDepth
                  isDark={isDark}
                  accentColor={accent}
                />,
              )}

              {card(
                "Liquid Morph",
                <LiquidMorph
                  isDark={isDark}
                  accentColor={accent}
                />,
              )}

              {card(
                "Mirror Sweep",
                <MirrorSweep
                  isDark={isDark}
                  accentColor={accent}
                />,
              )}
            </GridContainer>
          </section>
        )}

        <section>
          <h2
            className={cn(
              "mb-6 border-b pb-2 text-sm font-semibold",
              t.sectionTitle,
              t.sectionBorder,
            )}
          >
            {compact ? "01" : "02"} — Light &amp; Material
          </h2>

          <GridContainer>
            {card(
              "Prism Edge",
              <PrismEdge
                isDark={isDark}
                accentColor={accent}
              />,
            )}

            {card(
              "Ice Tiles",
              <IceTiles
                isDark={isDark}
                accentColor={accent}
              />,
            )}

            {card(
              "Glass Orb",
              <GlassOrb
                isDark={isDark}
                accentColor={accent}
              />,
            )}
          </GridContainer>
        </section>

        <section>
          <h2
            className={cn(
              "mb-6 border-b pb-2 text-sm font-semibold",
              t.sectionTitle,
              t.sectionBorder,
            )}
          >
            {compact ? "02" : "03"} — Physics &amp; Trace
          </h2>

          <GridContainer>
            {card(
              "Vapor Trail",
              <VaporTrail
                isDark={isDark}
                accentColor={accent}
              />,
            )}

            {card(
              "Condensation Ring",
              <CondensationRing
                isDark={isDark}
                accentColor={accent}
              />,
            )}
          </GridContainer>
        </section>
      </div>
    </div>
  );
}

export { GlassSelectors };
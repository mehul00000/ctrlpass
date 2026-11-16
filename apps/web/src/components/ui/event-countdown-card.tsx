"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/Button";

interface EventCountdownCardProps {
  title?: string;
  date?: Date;
  image?: string;
  attendees?: number;
  onJoin?: () => void;
  enableAnimations?: boolean;
  className?: string;
}

export function EventCountdownCard({
  title = "React & AI Workshop",
  date,
  image = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
  attendees = 42,
  onJoin,
  enableAnimations = true,
  className,
}: EventCountdownCardProps) {
  const [eventDate] = useState(
    () =>
      date ||
      new Date(
        Date.now() +
          2 * 24 * 60 * 60 * 1000 +
          5 * 60 * 60 * 1000 +
          30 * 60 * 1000,
      ),
  );

  const targetDate = date || eventDate;

  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000)),
  );

  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(
        0,
        Math.floor((targetDate.getTime() - Date.now()) / 1000),
      );

      setTimeLeft(remaining);
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const getTimeUnits = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return {
      days,
      hours,
      minutes,
      seconds: secs,
    };
  };

  const { days, hours, minutes, seconds } = getTimeUnits(timeLeft);
  const startsSoon = timeLeft > 0 && timeLeft < 86400;

  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.97,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 28,
        staggerChildren: 0.07,
        delayChildren: 0.05,
      },
    },
    hover: shouldAnimate
      ? {
          y: -5,
          transition: {
            type: "spring" as const,
            stiffness: 300,
            damping: 28,
          },
        }
      : {},
  };

  const childVariants = {
    hidden: {
      opacity: 0,
      y: 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 360,
        damping: 26,
      },
    },
  };

  return (
    <motion.div
      data-slot="event-countdown-card"
      initial={shouldAnimate ? "hidden" : "visible"}
      animate="visible"
      whileHover="hover"
      variants={containerVariants}
      className={cn(
        "group relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0B0B0B] text-[#F5F5F2] shadow-2xl shadow-black/30",
        className,
      )}
    >
      {/* Image */}
      <motion.div
        className="relative overflow-hidden"
        variants={shouldAnimate ? childVariants : {}}
      >
        <motion.img
          src={image}
          alt={title}
          className="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/10" />

        {startsSoon && (
          <div className="absolute right-4 top-4 rounded-full border border-[#D6B47A]/30 bg-[#050505]/85 px-3 py-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-[#D6B47A] backdrop-blur-sm">
            Starts Soon
          </div>
        )}
      </motion.div>

      {/* Content */}
      <div className="space-y-5 p-6">
        <motion.div
          className="space-y-3"
          variants={shouldAnimate ? childVariants : {}}
        >
          <h3 className="font-display text-xl font-semibold leading-tight tracking-tight text-[#F5F5F2]">
            {title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#77736C]">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#D6B47A]" />
              <span>{targetDate.toLocaleDateString("en-IN")}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#D6B47A]" />
              <span>{attendees} attending</span>
            </div>
          </div>
        </motion.div>

        {/* Countdown */}
        {timeLeft > 0 ? (
          <motion.div
            className="space-y-3"
            variants={shouldAnimate ? childVariants : {}}
          >
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#77736C]">
              <Clock className="h-3.5 w-3.5 text-[#D6B47A]" />
              <span>Event starts in</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { value: days, label: "Days" },
                { value: hours, label: "Hours" },
                { value: minutes, label: "Min" },
                { value: seconds, label: "Sec" },
              ].map((unit, index) => (
                <motion.div
                  key={unit.label}
                  animate={
                    shouldAnimate && index === 3
                      ? {
                          scale: [1, 1.03, 1],
                        }
                      : undefined
                  }
                  transition={
                    shouldAnimate && index === 3
                      ? {
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                      : undefined
                  }
                  className="rounded-xl border border-white/[0.06] bg-[#111111] p-3 text-center"
                >
                  <div className="font-mono text-lg font-semibold tabular-nums text-[#F5F5F2]">
                    {unit.value.toString().padStart(2, "0")}
                  </div>

                  <div className="mt-1 text-[9px] font-medium uppercase tracking-wider text-[#77736C]">
                    {unit.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={shouldAnimate ? childVariants : {}}
            className="rounded-xl border border-[#7FBF9A]/15 bg-[#7FBF9A]/[0.05] px-4 py-4 text-center"
          >
            <div className="text-sm font-semibold text-[#7FBF9A]">
              Event Started
            </div>

            <div className="mt-1 text-xs text-[#77736C]">
              Join now to participate
            </div>
          </motion.div>
        )}

        {/* Action */}
        <motion.button
          type="button"
          onClick={onJoin}
          variants={shouldAnimate ? childVariants : {}}
          whileHover={shouldAnimate ? { y: -2 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-11 w-full rounded-xl font-semibold",
          )}
        >
          {timeLeft > 0 ? "Reserve Your Spot" : "Join Event"}
        </motion.button>
      </div>
    </motion.div>
  );
}
"use client";

import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { CheckCheck, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useId, useRef, useState } from "react";

const PricingSwitch = ({
  button1,
  button2,
  onSwitch,
  className,
  layoutId,
}: {
  button1: string;
  button2: string;
  onSwitch: (value: string) => void;
  className?: string;
  layoutId?: string;
}) => {
  const [selected, setSelected] = useState("0");
  const uniqueId = useId();
  const switchLayoutId = layoutId || `switch-${uniqueId}`;

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div
      className={cn(
        "relative z-10 flex w-full rounded-full border border-[#262626] bg-[#080808] p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => handleSwitch("0")}
        className={cn(
          "relative z-10 w-full rounded-full px-3 py-1 font-medium transition-colors sm:h-14 sm:px-6 sm:py-2",
          "h-10",
          selected === "0"
            ? "text-[#050505]"
            : "text-[#A7A39B] hover:text-[#F5F5F2]",
        )}
      >
        {selected === "0" && (
          <motion.span
            layoutId={switchLayoutId}
            className="absolute inset-0 rounded-full border border-[#D6B47A] bg-[#D6B47A] shadow-[0_4px_18px_rgba(214,180,122,0.12)]"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}

        <span className="relative">{button1}</span>
      </button>

      <button
        type="button"
        onClick={() => handleSwitch("1")}
        className={cn(
          "relative z-10 w-full flex-shrink-0 rounded-full px-3 py-1 font-medium transition-colors sm:h-14 sm:px-6 sm:py-2",
          "h-10",
          selected === "1"
            ? "text-[#050505]"
            : "text-[#A7A39B] hover:text-[#F5F5F2]",
        )}
      >
        {selected === "1" && (
          <motion.span
            layoutId={switchLayoutId}
            className="absolute inset-0 rounded-full border border-[#D6B47A] bg-[#D6B47A] shadow-[0_4px_18px_rgba(214,180,122,0.12)]"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}

        <span className="relative flex items-center justify-center gap-2">
          {button2}
        </span>
      </button>
    </div>
  );
};

export default function PricingSection2() {
  const [isUpdates, setIsUpdates] = useState(false);
  const [isCorporate, setIsCorporate] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.3,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const timelineVaraints = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const toggleUpdates = (value: string) =>
    setIsUpdates(Number.parseInt(value) === 1);

  const toggleCorporate = (value: string) =>
    setIsCorporate(Number.parseInt(value) === 1);

  const calculatePrice = () => {
    if (!isUpdates && !isCorporate) return 98;
    if (isUpdates && !isCorporate) return 400;
    if (!isUpdates && isCorporate) return 159;
    if (isUpdates && isCorporate) return 650;
    return 98;
  };

  const calculateOriginalPrice = () => {
    const currentPrice = calculatePrice();
    return Math.round(currentPrice * 1.45);
  };

  const currentPrice = calculatePrice();
  const originalPrice = calculateOriginalPrice();

  const features = [
    "Figma Design system file",
    "2000+ components and variants",
    "Predefined style system",
    "Free licensed icons",
    "Step-by-step tutorial",
    "Use on unlimited projects",
    "Friendly support",
  ];

  return (
    <div
      ref={pricingRef}
      className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#050505] px-4 pt-10 text-[#F5F5F2]"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#D6B47A]/[0.035] blur-[140px]" />
        <div className="absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full bg-[#B88A45]/[0.025] blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[#1C1C1C] bg-[#080808] px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <TimelineContent
            as="div"
            animationNum={0}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="mb-4 flex items-center justify-center"
          >
            <div className="flex items-center gap-2 rounded-full border border-[#2A2A2A] bg-[#111111] px-3 py-1.5">
              <Zap className="h-4 w-4 fill-[#D6B47A] text-[#D6B47A]" />
              <span className="text-sm font-medium text-[#D6B47A]">
                Time to connect
              </span>
            </div>
          </TimelineContent>

          <h1 className="mb-4 text-3xl font-semibold leading-[120%] tracking-[-0.03em] text-[#F5F5F2] sm:text-4xl md:text-5xl">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.15}
              staggerFrom="first"
              reverse={true}
              containerClassName="justify-center"
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 40,
                delay: 0.4,
              }}
            >
              Let&apos;s get started
            </VerticalCutReveal>
          </h1>

          <TimelineContent
            as="p"
            animationNum={1}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="text-base text-[#A7A39B] sm:text-xl"
          >
            Get Module, connect, save time and money. Profit!
          </TimelineContent>
        </div>
      </div>

      {/* Product Features */}
      <div className="relative z-10 px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            {/* Features */}
            <div>
              <TimelineContent
                as="h3"
                animationNum={2}
                timelineRef={pricingRef}
                customVariants={revealVariants}
                className="mb-6 text-2xl font-medium tracking-[-0.02em] text-[#F5F5F2] sm:text-3xl"
              >
                What&apos;s inside
              </TimelineContent>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <TimelineContent
                    key={index}
                    as="div"
                    animationNum={3 + index}
                    timelineRef={pricingRef}
                    customVariants={timelineVaraints}
                    className="flex items-center"
                  >
                    <div className="mr-3 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#D6B47A]/30 bg-[#D6B47A]/[0.08]">
                      <CheckCheck className="h-4 w-4 text-[#D6B47A]" />
                    </div>

                    <span className="text-sm text-[#A7A39B] sm:text-base">
                      {feature}
                    </span>
                  </TimelineContent>
                ))}
              </div>
            </div>

            {/* Pricing controls */}
            <div className="rounded-2xl border border-[#242424] bg-[#080808] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:p-7">
              <div className="space-y-8">
                <TimelineContent
                  as="div"
                  animationNum={3}
                  timelineRef={pricingRef}
                  customVariants={revealVariants}
                >
                  <h4 className="mb-2 font-semibold text-[#F5F5F2]">
                    Access to updates
                  </h4>

                  <p className="mb-3 text-sm text-[#77736C]">
                    One-time payment, updates come to the email
                  </p>

                  <PricingSwitch
                    button1="3 Months"
                    button2="Forever"
                    onSwitch={toggleUpdates}
                    className="grid w-full grid-cols-2"
                  />
                </TimelineContent>

                <TimelineContent
                  as="div"
                  animationNum={4}
                  timelineRef={pricingRef}
                  customVariants={revealVariants}
                >
                  <h4 className="mb-2 font-semibold text-[#F5F5F2]">
                    Lifetime license
                  </h4>

                  <p className="mb-3 text-sm text-[#77736C]">
                    Select Corporate if you&apos;re part of the team
                  </p>

                  <PricingSwitch
                    button1="Personal"
                    button2="Corporate"
                    onSwitch={toggleCorporate}
                    className="grid w-full grid-cols-2"
                  />
                </TimelineContent>

                <TimelineContent
                  as="div"
                  animationNum={5}
                  timelineRef={pricingRef}
                  customVariants={revealVariants}
                  className="grid grid-cols-1 items-center gap-4 px-1 sm:grid-cols-2"
                >
                  <div className="flex items-center">
                    <span className="text-4xl font-semibold tracking-tight text-[#F5F5F2] sm:text-5xl">
                      $
                      <NumberFlow
                        value={currentPrice}
                        className="text-4xl font-semibold sm:text-5xl"
                      />
                    </span>

                    <span className="relative ml-2 text-lg text-[#77736C] line-through">
                      $
                      <NumberFlow
                        value={originalPrice}
                        className="text-lg font-semibold"
                      />
                    </span>
                  </div>

                  <TimelineContent
                    as="div"
                    animationNum={6}
                    timelineRef={pricingRef}
                    customVariants={revealVariants}
                  >
                    <button
                      type="button"
                      className={cn(
                        "h-12 w-full rounded-full border px-5 text-base font-semibold transition-all sm:h-14 sm:text-lg",
                        "border-[#D6B47A] bg-[#D6B47A] text-[#050505]",
                        "hover:bg-[#E2C58F] hover:shadow-[0_0_30px_rgba(214,180,122,0.14)]",
                        "active:scale-[0.99]",
                      )}
                    >
                      Purchase
                    </button>
                  </TimelineContent>
                </TimelineContent>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal {
    visibility: hidden;
  }

  .film-grain {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 50;
    opacity: 0.035;
    mix-blend-mode: overlay;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
    background-size: 64px 64px;
    background-image:
      linear-gradient(to right, rgba(245,245,242,0.035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(245,245,242,0.035) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 72%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 72%);
  }

  .text-3d-matte {
    color: #F5F5F2;
    text-shadow:
      0 14px 34px rgba(0,0,0,0.5),
      0 3px 8px rgba(0,0,0,0.4);
  }

  .text-silver-matte {
    background: linear-gradient(
      180deg,
      #F5F5F2 0%,
      #D6B47A 48%,
      #8E6A3B 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter:
      drop-shadow(0 14px 24px rgba(0,0,0,0.45))
      drop-shadow(0 3px 6px rgba(214,180,122,0.08));
  }

  .text-card-silver-matte {
    background: linear-gradient(
      180deg,
      #F5F5F2 0%,
      #D6B47A 55%,
      #A98550 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter:
      drop-shadow(0 12px 24px rgba(0,0,0,0.85))
      drop-shadow(0 3px 8px rgba(214,180,122,0.1));
  }

  .premium-depth-card {
    background:
      radial-gradient(
        700px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
        rgba(214,180,122,0.09),
        transparent 42%
      ),
      linear-gradient(
        145deg,
        #181818 0%,
        #0D0D0D 48%,
        #080808 100%
      );
    box-shadow:
      0 45px 110px -25px rgba(0,0,0,0.95),
      0 20px 45px -20px rgba(0,0,0,0.85),
      inset 0 1px 2px rgba(255,255,255,0.08),
      inset 0 -2px 5px rgba(0,0,0,0.9);
    border: 1px solid rgba(214,180,122,0.12);
    position: relative;
  }

  .card-sheen {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: 50;
    background:
      radial-gradient(
        700px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
        rgba(214,180,122,0.08) 0%,
        transparent 42%
      );
    mix-blend-mode: screen;
    transition: opacity 0.3s ease;
  }

  .iphone-bezel {
    background-color: #0B0B0B;
    box-shadow:
      inset 0 0 0 2px #4A4843,
      inset 0 0 0 7px #000,
      0 40px 80px -15px rgba(0,0,0,0.95),
      0 15px 25px -5px rgba(0,0,0,0.8);
    transform-style: preserve-3d;
  }

  .hardware-btn {
    background: linear-gradient(
      90deg,
      #45423C 0%,
      #171717 100%
    );
    box-shadow:
      -2px 0 5px rgba(0,0,0,0.8),
      inset -1px 0 1px rgba(255,255,255,0.12),
      inset 1px 0 2px rgba(0,0,0,0.8);
    border-left: 1px solid rgba(255,255,255,0.05);
  }

  .screen-glare {
    background:
      linear-gradient(
        110deg,
        rgba(255,255,255,0.08) 0%,
        rgba(255,255,255,0) 45%
      );
  }

  .widget-depth {
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,0.045) 0%,
        rgba(255,255,255,0.012) 100%
      );
    box-shadow:
      0 10px 20px rgba(0,0,0,0.3),
      inset 0 1px 1px rgba(255,255,255,0.05),
      inset 0 -1px 1px rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.045);
  }

  .floating-ui-badge {
    background:
      linear-gradient(
        135deg,
        rgba(255,255,255,0.075) 0%,
        rgba(255,255,255,0.012) 100%
      );
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 0 0 1px rgba(214,180,122,0.12),
      0 25px 50px -12px rgba(0,0,0,0.8),
      inset 0 1px 1px rgba(255,255,255,0.1),
      inset 0 -1px 1px rgba(0,0,0,0.5);
  }

  .btn-modern-light,
  .btn-modern-dark {
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .btn-modern-light {
    background: linear-gradient(
      180deg,
      #D6B47A 0%,
      #B88A45 100%
    );
    color: #050505;
    box-shadow:
      0 0 0 1px rgba(214,180,122,0.18),
      0 4px 10px rgba(0,0,0,0.25),
      0 15px 30px -8px rgba(0,0,0,0.45),
      inset 0 1px 1px rgba(255,255,255,0.35),
      inset 0 -3px 6px rgba(0,0,0,0.08);
  }

  .btn-modern-light:hover {
    transform: translateY(-3px);
    background: linear-gradient(
      180deg,
      #E1C38B 0%,
      #D6B47A 100%
    );
    box-shadow:
      0 0 0 1px rgba(214,180,122,0.25),
      0 8px 16px rgba(0,0,0,0.25),
      0 22px 35px -8px rgba(0,0,0,0.5),
      inset 0 1px 1px rgba(255,255,255,0.4);
  }

  .btn-modern-light:active {
    transform: translateY(1px);
  }

  .btn-modern-dark {
    background:
      linear-gradient(
        180deg,
        #1B1B1B 0%,
        #0D0D0D 100%
      );
    color: #F5F5F2;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.1),
      0 2px 4px rgba(0,0,0,0.7),
      0 12px 24px -4px rgba(0,0,0,0.9),
      inset 0 1px 1px rgba(255,255,255,0.08),
      inset 0 -3px 6px rgba(0,0,0,0.8);
  }

  .btn-modern-dark:hover {
    transform: translateY(-3px);
    border-color: rgba(214,180,122,0.3);
    box-shadow:
      0 0 0 1px rgba(214,180,122,0.16),
      0 8px 16px rgba(0,0,0,0.7),
      0 22px 35px -8px rgba(0,0,0,1),
      inset 0 1px 1px rgba(255,255,255,0.12);
  }

  .btn-modern-dark:active {
    transform: translateY(1px);
  }

  .progress-ring {
    transform: rotate(-90deg);
    transform-origin: center;
    stroke-dasharray: 402;
    stroke-dashoffset: 402;
    stroke-linecap: round;
  }
`;

export interface CinematicHeroProps
  extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  tagline1?: string;
  tagline2?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  metricValue?: number;
  metricLabel?: string;
  ctaHeading?: string;
  ctaDescription?: string;
}

export function CinematicHero({
  brandName = "CtrlPass",
  tagline1 = "Discover the moment,",
  tagline2 = "not just the event.",
  cardHeading = "Events, redefined.",
  cardDescription = (
    <>
      <span className="font-semibold text-[#D6B47A]">
        CtrlPass
      </span>{" "}
      brings discovery, booking, ticketing, and unforgettable
      experiences together in one refined platform.
    </>
  ),
  metricValue = 365,
  metricLabel = "Events Found",
  ctaHeading = "Find your next experience.",
  ctaDescription = "Discover events worth remembering and book your next experience with CtrlPass.",
  className,
  ...props
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;

      cancelAnimationFrame(requestRef.current);

      requestRef.current = requestAnimationFrame(() => {
        if (!mainCardRef.current || !mockupRef.current) {
          return;
        }

        const rect =
          mainCardRef.current.getBoundingClientRect();

        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        mainCardRef.current.style.setProperty(
          "--mouse-x",
          `${mouseX}px`,
        );

        mainCardRef.current.style.setProperty(
          "--mouse-y",
          `${mouseY}px`,
        );

        const xVal =
          (event.clientX / window.innerWidth - 0.5) * 2;

        const yVal =
          (event.clientY / window.innerHeight - 0.5) * 2;

        gsap.to(mockupRef.current, {
          rotationY: xVal * 10,
          rotationX: -yVal * 10,
          ease: "power3.out",
          duration: 1.2,
          overwrite: true,
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove,
      );

      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      gsap.set(".text-track", {
        autoAlpha: 0,
        y: 60,
        scale: 0.85,
        filter: "blur(20px)",
        rotationX: -20,
      });

      gsap.set(".text-days", {
        autoAlpha: 1,
        clipPath: "inset(0 100% 0 0)",
      });

      gsap.set(".main-card", {
        y: window.innerHeight + 200,
        autoAlpha: 1,
      });

      gsap.set(
        [
          ".card-left-text",
          ".card-right-text",
          ".mockup-scroll-wrapper",
          ".floating-badge",
          ".phone-widget",
        ],
        {
          autoAlpha: 0,
        },
      );

      gsap.set(".cta-wrapper", {
        autoAlpha: 0,
        scale: 0.8,
        filter: "blur(30px)",
      });

      const introTl = gsap.timeline({
        delay: 0.3,
      });

      introTl
        .to(".text-track", {
          duration: 1.8,
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          rotationX: 0,
          ease: "expo.out",
        })
        .to(
          ".text-days",
          {
            duration: 1.4,
            clipPath: "inset(0 0% 0 0)",
            ease: "power4.inOut",
          },
          "-=1",
        );

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=7000",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to(
          [".hero-text-wrapper", ".bg-grid-theme"],
          {
            scale: 1.15,
            filter: "blur(20px)",
            opacity: 0.2,
            ease: "power2.inOut",
            duration: 2,
          },
          0,
        )
        .to(
          ".main-card",
          {
            y: 0,
            ease: "power3.inOut",
            duration: 2,
          },
          0,
        )
        .to(".main-card", {
          width: "100%",
          height: "100%",
          borderRadius: "0px",
          ease: "power3.inOut",
          duration: 1.5,
        })
        .fromTo(
          ".mockup-scroll-wrapper",
          {
            y: 300,
            z: -500,
            rotationX: 50,
            rotationY: -30,
            autoAlpha: 0,
            scale: 0.6,
          },
          {
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            autoAlpha: 1,
            scale: 1,
            ease: "expo.out",
            duration: 2.5,
          },
          "-=0.8",
        )
        .fromTo(
          ".phone-widget",
          {
            y: 40,
            autoAlpha: 0,
            scale: 0.95,
          },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            stagger: 0.15,
            ease: "back.out(1.2)",
            duration: 1.5,
          },
          "-=1.5",
        )
        .to(
          ".progress-ring",
          {
            strokeDashoffset: 60,
            duration: 2,
            ease: "power3.inOut",
          },
          "-=1.2",
        )
        .to(
          ".counter-val",
          {
            innerHTML: metricValue,
            snap: {
              innerHTML: 1,
            },
            duration: 2,
            ease: "expo.out",
          },
          "-=2",
        )
        .fromTo(
          ".floating-badge",
          {
            y: 100,
            autoAlpha: 0,
            scale: 0.7,
            rotationZ: -10,
          },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            rotationZ: 0,
            ease: "back.out(1.5)",
            duration: 1.5,
            stagger: 0.2,
          },
          "-=2",
        )
        .fromTo(
          ".card-left-text",
          {
            x: -50,
            autoAlpha: 0,
          },
          {
            x: 0,
            autoAlpha: 1,
            ease: "power4.out",
            duration: 1.5,
          },
          "-=1.5",
        )
        .fromTo(
          ".card-right-text",
          {
            x: 50,
            autoAlpha: 0,
            scale: 0.8,
          },
          {
            x: 0,
            autoAlpha: 1,
            scale: 1,
            ease: "expo.out",
            duration: 1.5,
          },
          "<",
        )
        .to({}, { duration: 2.5 })
        .set(".hero-text-wrapper", {
          autoAlpha: 0,
        })
        .set(".cta-wrapper", {
          autoAlpha: 1,
        })
        .to({}, { duration: 1.5 })
        .to(
          [
            ".mockup-scroll-wrapper",
            ".floating-badge",
            ".card-left-text",
            ".card-right-text",
          ],
          {
            scale: 0.9,
            y: -40,
            z: -200,
            autoAlpha: 0,
            ease: "power3.in",
            duration: 1.2,
            stagger: 0.05,
          },
        )
        .to(
          ".main-card",
          {
            width: isMobile ? "92vw" : "85vw",
            height: isMobile ? "92vh" : "85vh",
            borderRadius: isMobile ? "32px" : "40px",
            ease: "expo.inOut",
            duration: 1.8,
          },
          "pullback",
        )
        .to(
          ".cta-wrapper",
          {
            scale: 1,
            filter: "blur(0px)",
            ease: "expo.inOut",
            duration: 1.8,
          },
          "pullback",
        )
        .to(".main-card", {
          y: -window.innerHeight - 300,
          ease: "power3.in",
          duration: 1.5,
        });
    }, containerRef);

    return () => ctx.revert();
  }, [metricValue]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#050505] font-sans antialiased text-[#F5F5F2]",
        className,
      )}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: INJECTED_STYLES,
        }}
      />

      <div className="film-grain" aria-hidden="true" />

      <div
        className="bg-grid-theme pointer-events-none absolute inset-0 z-0 opacity-60"
        aria-hidden="true"
      />

      {/* Ambient champagne glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[55vw] w-[55vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(214,180,122,0.12) 0%, transparent 68%)",
        }}
        aria-hidden="true"
      />

      {/* Hero Text */}
      <div className="hero-text-wrapper absolute z-10 flex w-screen flex-col items-center justify-center px-4 text-center will-change-transform [transform-style:preserve-3d]">
        <h1 className="text-track gsap-reveal text-3d-matte mb-2 text-5xl font-bold tracking-tight md:text-7xl lg:text-[6rem]">
          {tagline1}
        </h1>

        <h1 className="text-days gsap-reveal text-silver-matte text-5xl font-extrabold tracking-tighter md:text-7xl lg:text-[6rem]">
          {tagline2}
        </h1>
      </div>

      {/* CTA */}
      <div className="cta-wrapper pointer-events-auto absolute z-10 flex w-screen flex-col items-center justify-center px-4 text-center gsap-reveal will-change-transform">
        <div className="mb-5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D6B47A]" />

          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#77736C]">
            CtrlPass / Experience
          </span>
        </div>

        <h2 className="text-silver-matte mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          {ctaHeading}
        </h2>

        <p className="mb-12 max-w-xl text-base font-light leading-relaxed text-[#A7A39B] md:text-xl">
          {ctaDescription}
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href="#"
            aria-label="Download on the App Store"
            className="btn-modern-light group flex items-center justify-center gap-3 rounded-[1.25rem] px-8 py-4 focus:outline-none focus:ring-2 focus:ring-[#D6B47A]"
          >
            <svg
              className="h-8 w-8 transition-transform group-hover:scale-105"
              fill="currentColor"
              viewBox="0 0 384 512"
              aria-hidden="true"
            >
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>

            <div className="text-left">
              <div className="mb-[-2px] text-[10px] font-bold uppercase tracking-wider text-[#050505]/55">
                Download on the
              </div>

              <div className="text-xl font-bold leading-none tracking-tight">
                App Store
              </div>
            </div>
          </a>

          <a
            href="#"
            aria-label="Get it on Google Play"
            className="btn-modern-dark group flex items-center justify-center gap-3 rounded-[1.25rem] border border-white/[0.08] px-8 py-4 focus:outline-none focus:ring-2 focus:ring-[#D6B47A]"
          >
            <svg
              className="h-7 w-7 transition-transform group-hover:scale-105"
              fill="currentColor"
              viewBox="0 0 512 512"
              aria-hidden="true"
            >
              <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
            </svg>

            <div className="text-left">
              <div className="mb-[-2px] text-[10px] font-bold uppercase tracking-wider text-[#77736C]">
                Get it on
              </div>

              <div className="text-xl font-bold leading-none tracking-tight text-[#F5F5F2]">
                Google Play
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Main Card */}
      <div
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        style={{ perspective: "1500px" }}
      >
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card gsap-reveal pointer-events-auto relative flex h-[92vh] w-[92vw] items-center justify-center overflow-hidden rounded-[32px] md:h-[85vh] md:w-[85vw] md:rounded-[40px]"
        >
          <div
            className="card-sheen"
            aria-hidden="true"
          />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-evenly px-4 py-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:px-12 lg:py-0">
            {/* Brand */}
            <div className="card-right-text order-1 z-20 flex w-full justify-center gsap-reveal lg:order-3 lg:justify-end">
              <h2 className="text-card-silver-matte text-6xl font-black uppercase tracking-tighter md:text-[6rem] lg:mt-0 lg:text-[8rem]">
                {brandName}
              </h2>
            </div>

            {/* Phone */}
            <div
              className="mockup-scroll-wrapper relative order-2 z-10 flex h-[380px] w-full items-center justify-center gsap-reveal lg:order-2 lg:h-[600px]"
              style={{ perspective: "1000px" }}
            >
              <div className="relative flex h-full w-full scale-[0.65] items-center justify-center md:scale-[0.85] lg:scale-100">
                <div
                  ref={mockupRef}
                  className="iphone-bezel relative flex h-[580px] w-[280px] flex-col rounded-[3rem] will-change-transform [transform-style:preserve-3d]"
                >
                  {/* Hardware */}
                  <div
                    className="hardware-btn absolute left-[-3px] top-[120px] z-0 h-[25px] w-[3px] rounded-l-md"
                    aria-hidden="true"
                  />

                  <div
                    className="hardware-btn absolute left-[-3px] top-[160px] z-0 h-[45px] w-[3px] rounded-l-md"
                    aria-hidden="true"
                  />

                  <div
                    className="hardware-btn absolute left-[-3px] top-[220px] z-0 h-[45px] w-[3px] rounded-l-md"
                    aria-hidden="true"
                  />

                  <div
                    className="hardware-btn absolute right-[-3px] top-[170px] z-0 h-[70px] w-[3px] scale-x-[-1] rounded-r-md"
                    aria-hidden="true"
                  />

                  {/* Screen */}
                  <div className="absolute inset-[7px] z-10 overflow-hidden rounded-[2.5rem] bg-[#050505] text-[#F5F5F2] shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
                    <div
                      className="screen-glare pointer-events-none absolute inset-0 z-40"
                      aria-hidden="true"
                    />

                    {/* Dynamic Island */}
                    <div className="absolute left-1/2 top-[5px] z-50 flex h-[28px] w-[100px] -translate-x-1/2 items-center justify-end rounded-full bg-black px-3 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)]">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7FBF9A] shadow-[0_0_8px_rgba(127,191,154,0.5)]" />
                    </div>

                    <div className="relative flex h-full w-full flex-col px-5 pb-8 pt-12">
                      <div className="phone-widget mb-8 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#77736C]">
                            Today
                          </span>

                          <span className="text-xl font-bold tracking-tight text-[#F5F5F2]">
                            Discover
                          </span>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-sm font-bold text-[#D6B47A]">
                          CP
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="phone-widget relative mx-auto mb-8 flex h-44 w-44 items-center justify-center">
                        <svg
                          className="absolute inset-0 h-full w-full"
                          aria-hidden="true"
                        >
                          <circle
                            cx="88"
                            cy="88"
                            r="64"
                            fill="none"
                            stroke="rgba(255,255,255,0.04)"
                            strokeWidth="12"
                          />

                          <circle
                            className="progress-ring"
                            cx="88"
                            cy="88"
                            r="64"
                            fill="none"
                            stroke="#D6B47A"
                            strokeWidth="12"
                          />
                        </svg>

                        <div className="z-10 flex flex-col items-center text-center">
                          <span className="counter-val text-4xl font-extrabold tracking-tighter text-[#F5F5F2]">
                            0
                          </span>

                          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#D6B47A]/60">
                            {metricLabel}
                          </span>
                        </div>
                      </div>

                      {/* Cards */}
                      <div className="space-y-3">
                        <div className="phone-widget widget-depth flex items-center rounded-2xl p-3">
                          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/[0.08]">
                            <svg
                              className="h-4 w-4 text-[#D6B47A]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>

                          <div className="flex-1">
                            <div className="mb-2 h-2 w-20 rounded-full bg-[#D6B47A]/50" />
                            <div className="h-1.5 w-12 rounded-full bg-white/[0.16]" />
                          </div>
                        </div>

                        <div className="phone-widget widget-depth flex items-center rounded-2xl p-3">
                          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6B47A]/20 bg-[#D6B47A]/[0.06]">
                            <svg
                              className="h-4 w-4 text-[#D6B47A]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>

                          <div className="flex-1">
                            <div className="mb-2 h-2 w-16 rounded-full bg-[#F5F5F2]/40" />
                            <div className="h-1.5 w-24 rounded-full bg-white/[0.16]" />
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-1/2 h-[4px] w-[120px] -translate-x-1/2 rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>

                {/* Floating Badge 1 */}
                <div className="floating-badge floating-ui-badge absolute left-[-15px] top-6 z-30 flex items-center gap-3 rounded-xl p-3 gsap-reveal lg:left-[-80px] lg:top-12 lg:gap-4 lg:rounded-2xl lg:p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D6B47A]/25 bg-[#D6B47A]/[0.08] lg:h-10 lg:w-10">
                    <span
                      className="text-base lg:text-xl"
                      aria-hidden="true"
                    >
                      ✦
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold tracking-tight text-[#F5F5F2] lg:text-sm">
                      Event Found
                    </p>

                    <p className="text-[10px] font-medium text-[#A7A39B] lg:text-xs">
                      Perfect match
                    </p>
                  </div>
                </div>

                {/* Floating Badge 2 */}
                <div className="floating-badge floating-ui-badge absolute bottom-12 right-[-15px] z-30 flex items-center gap-3 rounded-xl p-3 gsap-reveal lg:bottom-20 lg:right-[-80px] lg:gap-4 lg:rounded-2xl lg:p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D6B47A]/25 bg-[#D6B47A]/[0.06] lg:h-10 lg:w-10">
                    <span
                      className="text-base lg:text-lg"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold tracking-tight text-[#F5F5F2] lg:text-sm">
                      Booking Confirmed
                    </p>

                    <p className="text-[10px] font-medium text-[#A7A39B] lg:text-xs">
                      Ticket secured
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card-left-text order-3 flex w-full max-w-none flex-col justify-center px-4 text-center gsap-reveal lg:order-1 lg:px-0 lg:text-left">
              <h3 className="mb-0 text-2xl font-bold tracking-tight text-[#F5F5F2] md:text-3xl lg:mb-5 lg:text-4xl">
                {cardHeading}
              </h3>

              <p className="hidden max-w-sm text-sm font-normal leading-relaxed text-[#A7A39B] md:block md:text-base lg:max-w-none lg:text-lg">
                {cardDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CinematicHero;
"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap, Shield, Terminal } from "lucide-react";

interface ClassicBadgesProps {
    theme?: "dark" | "light";
    compact?: boolean;
    accentColor?: string;
}

// --- Theme Config ---
const darkTheme = {
    bg: "bg-[#050505]",
    text: "text-zinc-100",
    cardBg: "bg-zinc-900/50 border-white/5 hover:border-white/10 hover:bg-zinc-900/80",
    cardTitle: "text-zinc-500",
    sectionTitle: "text-zinc-400",
    sectionBorder: "border-zinc-900",
    eyebrow: "text-zinc-600",
    heading: "text-white",
    subheading: "text-zinc-500",
};

const lightTheme = {
    bg: "bg-[#f8f8f8]",
    text: "text-zinc-900",
    cardBg: "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80",
    cardTitle: "text-zinc-400",
    sectionTitle: "text-zinc-500",
    sectionBorder: "border-zinc-200",
    eyebrow: "text-zinc-400",
    heading: "text-zinc-900",
    subheading: "text-zinc-400",
};

// --- Layout Components ---
const GridContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
    </div>
);

const ShowcaseCard = ({ title, className, children, cardBg, cardTitle }: {
    title: string;
    className?: string;
    children: React.ReactNode;
    cardBg: string;
    cardTitle: string;
}) => (
    <div className={cn("group relative overflow-hidden rounded-xl border p-6 backdrop-blur-sm transition-colors", cardBg, className)}>
        <h3 className={cn("mb-4 text-xs font-medium uppercase tracking-widest", cardTitle)}>{title}</h3>
        <div className="flex flex-wrap items-center gap-3">
            {children}
        </div>
    </div>
);

// --- 1. Minimal Status Badges (Glassy) ---
const GlassyBadge = ({ status, children }: { status: "success" | "warning" | "error" | "neutral"; children: React.ReactNode }) => {
    const styles = {
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-5px_rgba(16,185,129,0.3)]",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_-5px_rgba(245,158,11,0.3)]",
        error: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_-5px_rgba(244,63,94,0.3)]",
        neutral: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    };
    return (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-md transition-all hover:bg-opacity-20", styles[status])}>
            {children}
        </span>
    );
};

// --- 2. Modern Status Indicators (Dot) ---
const DotBadge = ({ color, label, dark }: { color: string; label: string; dark: boolean }) => (
    <span className={cn(
        "inline-flex items-center gap-2 rounded-full border py-1 pl-2 pr-3 text-xs",
        dark ? "border-zinc-800 bg-zinc-950/50 text-zinc-300" : "border-zinc-200 bg-white text-zinc-600"
    )}>
        <span className="relative flex h-2 w-2">
            <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", color)} />
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)} />
        </span>
        {label}
    </span>
);

// --- 3. Micro Status (Glowing Edges) ---
const MicroBadge = ({ children, accentColor }: { children: React.ReactNode; accentColor: string }) => (
    <motion.span
        whileHover={{ scale: 1.05 }}
        className="relative overflow-hidden rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
        style={{
            background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
            color: accentColor,
            boxShadow: `0 0 0 1px ${accentColor}40`,
        }}
    >
        {children}
    </motion.span>
);

// --- 4. Tag Chips (Pastel) ---
const PastelChip = ({ color, children, dark }: { color: "blue" | "purple" | "orange"; children: React.ReactNode; dark: boolean }) => {
    const darkStyles = {
        blue: "bg-blue-950 text-blue-300 border-blue-800/50 hover:bg-blue-900",
        purple: "bg-purple-950 text-purple-300 border-purple-800/50 hover:bg-purple-900",
        orange: "bg-orange-950 text-orange-300 border-orange-800/50 hover:bg-orange-900",
    };
    const lightStyles = {
        blue: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
        purple: "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100",
        orange: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100",
    };
    return (
        <span className={cn("cursor-default rounded-md border px-3 py-1 text-xs font-medium transition-colors", dark ? darkStyles[color] : lightStyles[color])}>
            {children}
        </span>
    );
};

// --- 5. Tech Tags (Monochrome) ---
const TechTag = ({ children, dark }: { children: React.ReactNode; dark: boolean }) => (
    <span className={cn(
        "group relative cursor-pointer border px-2 py-1 font-mono text-[10px] uppercase transition-colors",
        dark
            ? "border-zinc-800 bg-black text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            : "border-zinc-300 bg-zinc-100 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
    )}>
        <span className="absolute -left-[1px] -top-[1px] h-1 w-1 bg-zinc-700 opacity-0 transition-opacity group-hover:opacity-100" />
        <span className="absolute -bottom-[1px] -right-[1px] h-1 w-1 bg-zinc-700 opacity-0 transition-opacity group-hover:opacity-100" />
        {children}
    </span>
);

// --- 6. Rounded Pills with Icons ---
const IconPill = ({ icon: Icon, label, dark }: { icon: any; label: string; dark: boolean }) => (
    <span className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs shadow-sm transition-all",
        dark
            ? "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700"
    )}>
        <Icon className="h-3 w-3" />
        {label}
    </span>
);

// --- 7. Tag System (Soft Blur) ---
const BlurTag = ({ children, dark }: { children: React.ReactNode; dark: boolean }) => (
    <span className={cn(
        "inline-flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1 text-xs font-medium backdrop-blur-md transition-colors",
        dark ? "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white" : "bg-zinc-900/5 text-zinc-600 hover:bg-zinc-900/10 hover:text-zinc-900"
    )}>
        {children}
    </span>
);

// --- 8. Label Grid (High Contrast) ---
const ContrastLabel = ({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) => (
    <span className={cn("rounded px-2 py-1 text-xs font-bold shadow-sm", bg, text)}>
        {children}
    </span>
);

// --- 9. Tiny Neon (Edge Lighting) ---
const NeonLabel = ({ color, label }: { color: string; label: string }) => (
    <div
        className="relative rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
        style={{ background: color, boxShadow: `0 0 14px -3px ${color}` }}
    >
        {label}
    </div>
);

// --- 10. Modern Glossy Surface ---
const GlossyLabel = ({ gradient, children }: { gradient: string; children: React.ReactNode }) => (
    <div className={cn("relative overflow-hidden rounded-md px-3 py-1 text-xs font-medium text-white shadow-inner", gradient)}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
        <span className="relative z-10">{children}</span>
    </div>
);

// --- Main Component ---
export default function ClassicBadges({ theme = "dark", compact = false, accentColor = "#6366f1" }: ClassicBadgesProps) {
    const t = theme === "dark" ? darkTheme : lightTheme;
    const isDark = theme === "dark";
    const pad = compact ? "p-5" : "p-8";
    const spacing = compact ? "space-y-8" : "space-y-12";

    const card = (title: string, children: React.ReactNode) => (
        <ShowcaseCard title={title} cardBg={t.cardBg} cardTitle={t.cardTitle}>{children}</ShowcaseCard>
    );

    return (
        <div className={cn("min-h-screen w-full font-sans", t.bg, t.text, pad)}>
            <div className={cn("mx-auto max-w-7xl", spacing)}>

                {/* Uilora Branded Header */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", t.eyebrow)}>Uilora</span>
                        <span className={cn("text-[10px]", t.eyebrow)}>·</span>
                        <span className={cn("text-[10px] font-medium uppercase tracking-[0.12em]", t.eyebrow)}>Badge System</span>
                    </div>
                    <h1 className={cn("text-3xl font-light tracking-tight", t.heading)}>Interface Labels</h1>
                    <p className={cn(t.subheading)}>Badges, chips, and tags designed for high-density luxury interfaces.</p>
                </div>

                {/* 01 — Status Badges */}
                {!compact && (
                    <section>
                        <h2 className={cn("mb-6 border-b pb-2 text-sm font-semibold", t.sectionTitle, t.sectionBorder)}>01 — Status Indicators</h2>
                        <GridContainer>
                            {card("Glassy Finish", <>
                                <GlassyBadge status="success">Operational</GlassyBadge>
                                <GlassyBadge status="warning">Degraded</GlassyBadge>
                                <GlassyBadge status="error">Offline</GlassyBadge>
                                <GlassyBadge status="neutral">Archived</GlassyBadge>
                            </>)}
                            {card("Dot Indicators", <>
                                <DotBadge dark={isDark} color="bg-emerald-500" label="Live" />
                                <DotBadge dark={isDark} color="bg-blue-500" label="Processing" />
                                <DotBadge dark={isDark} color="bg-zinc-500" label="Queued" />
                            </>)}
                            {card("Micro Glow", <>
                                <MicroBadge accentColor={accentColor}>V2.0</MicroBadge>
                                <MicroBadge accentColor={accentColor}>BETA</MicroBadge>
                                <MicroBadge accentColor={accentColor}>PRO</MicroBadge>
                            </>)}
                        </GridContainer>
                    </section>
                )}

                {/* 02 — Categorization */}
                <section>
                    <h2 className={cn("mb-6 border-b pb-2 text-sm font-semibold", t.sectionTitle, t.sectionBorder)}>
                        {compact ? "01" : "02"} — Categorization
                    </h2>
                    <GridContainer>
                        {card("Elevated Pastel", <>
                            <PastelChip dark={isDark} color="blue">Finance</PastelChip>
                            <PastelChip dark={isDark} color="purple">Analytics</PastelChip>
                            <PastelChip dark={isDark} color="orange">Security</PastelChip>
                        </>)}
                        {card("Tech Mono", <>
                            <TechTag dark={isDark}>REACT</TechTag>
                            <TechTag dark={isDark}>TYPESCRIPT</TechTag>
                            <TechTag dark={isDark}>TAILWIND</TechTag>
                        </>)}
                        {card("Interactive Icons", <>
                            <IconPill dark={isDark} icon={Zap} label="Fast" />
                            <IconPill dark={isDark} icon={Shield} label="Secure" />
                            <IconPill dark={isDark} icon={Terminal} label="Shell" />
                        </>)}
                        {card("Frost System", <>
                            <BlurTag dark={isDark}>Design</BlurTag>
                            <BlurTag dark={isDark}>Development</BlurTag>
                            <BlurTag dark={isDark}>Marketing</BlurTag>
                            <BlurTag dark={isDark}>+2</BlurTag>
                        </>)}
                    </GridContainer>
                </section>

                {/* 03 — Labelling */}
                <section>
                    <h2 className={cn("mb-6 border-b pb-2 text-sm font-semibold", t.sectionTitle, t.sectionBorder)}>
                        {compact ? "02" : "03"} — Labelling
                    </h2>
                    <GridContainer>
                        {card("Solid Contrast", <>
                            <ContrastLabel bg="bg-zinc-100" text="text-black">ADMIN</ContrastLabel>
                            <ContrastLabel bg="bg-indigo-600" text="text-white">USER</ContrastLabel>
                            <ContrastLabel bg="bg-rose-600" text="text-white">ROOT</ContrastLabel>
                        </>)}
                        {card("Neon Edge", <>
                            <NeonLabel color="#06b6d4" label="New" />
                            <NeonLabel color="#d946ef" label="Hot" />
                            <NeonLabel color="#84cc16" label="Sale" />
                        </>)}
                        {card("Glossy Gradients", <>
                            <GlossyLabel gradient="bg-gradient-to-r from-violet-600 to-indigo-600">Premium</GlossyLabel>
                            <GlossyLabel gradient="bg-gradient-to-r from-emerald-500 to-teal-500">Verified</GlossyLabel>
                            <GlossyLabel gradient="bg-gradient-to-r from-slate-600 to-slate-800">Standard</GlossyLabel>
                        </>)}
                    </GridContainer>
                </section>

            </div>
        </div>
    );
}

export { ClassicBadges };
